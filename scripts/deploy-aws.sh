#!/usr/bin/env bash
# Deploys the site as a static export to S3 behind CloudFront. Safe to re-run: every resource is created
# only if it doesn't exist yet, otherwise it is updated in place.
#
#   scripts/deploy-aws.sh                 # build + deploy: AWS profile "clp", us-east-1, NAME "clp-prod"
#   STAGE=staging scripts/deploy-aws.sh   # a separate stack ("clp-staging")
#   SKIP_BUILD=1 scripts/deploy-aws.sh    # deploy the existing out/ folder
#   AWS_PROFILE_NAME=x REGION=y NAME=z BUCKET=w scripts/deploy-aws.sh   # another account / naming
#
# Resources (NAME = clp-<stage> by default):
#   S3 bucket               <BUCKET> (= <NAME>-web)  private, only CloudFront can read it (Origin Access Control)
#   Origin Access Control   <NAME>-oac
#   CloudFront Function     <NAME>-router         redirects + "/path/" -> "/path/index.html" (scripts/aws/cloudfront-function.js)
#   CloudFront distribution comment "<NAME>"
set -euo pipefail

AWS_PROFILE_NAME="${AWS_PROFILE_NAME:-clp}"
REGION="${REGION:-us-east-1}"
STAGE="${STAGE:-prod}"
NAME="${NAME:-clp-${STAGE}}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/out"
aws() { command aws --profile "$AWS_PROFILE_NAME" "$@"; }
log() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
# S3 bucket names are global and allow only lowercase letters, digits, "-" and "." (no "_").
BUCKET="${BUCKET:-$NAME-web}"
echo "Profile: $AWS_PROFILE_NAME | Account: $ACCOUNT_ID | Region: $REGION | Bucket: $BUCKET"

# 1. Build ------------------------------------------------------------------------------------------------
if [ "${SKIP_BUILD:-}" != "1" ]; then
  log "Building static export"
  (cd "$ROOT" && STATIC_EXPORT=1 npm run build)
fi
[ -f "$OUT/index.html" ] || { echo "No $OUT/index.html - build first"; exit 1; }

# 2. Bucket -----------------------------------------------------------------------------------------------
log "S3 bucket $BUCKET"
if ! aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  # us-east-1 is the default location and rejects an explicit LocationConstraint.
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" >/dev/null
  else
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION" >/dev/null
  fi
  echo "created"
fi
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-tagging --bucket "$BUCKET" --tagging "TagSet=[{Key=Project,Value=clp},{Key=Stage,Value=$STAGE}]"

# 3. Upload (hashed build assets cached for a year, images for 30 days, pages always revalidated) ---------
log "Uploading $OUT"
aws s3 sync --only-show-errors "$OUT/_next/static" "s3://$BUCKET/_next/static" --region "$REGION" --delete \
  --cache-control "public,max-age=31536000,immutable"
aws s3 sync --only-show-errors "$OUT/uploads" "s3://$BUCKET/uploads" --region "$REGION" --delete \
  --cache-control "public,max-age=2592000"
aws s3 sync --only-show-errors "$OUT" "s3://$BUCKET" --region "$REGION" --delete \
  --exclude "_next/static/*" --exclude "uploads/*" \
  --cache-control "public,max-age=0,must-revalidate"

# 4. Origin Access Control ----------------------------------------------------------------------------------
log "Origin Access Control $NAME-oac"
OAC_ID="$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='$NAME-oac'].Id | [0]" --output text)"
if [ "$OAC_ID" = "None" ] || [ -z "$OAC_ID" ]; then
  OAC_ID="$(aws cloudfront create-origin-access-control --origin-access-control-config \
    "Name=$NAME-oac,Description=$NAME S3 access,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
    --query OriginAccessControl.Id --output text)"
  echo "created $OAC_ID"
fi

# 5. CloudFront Function (create or update, then publish) ---------------------------------------------------
log "CloudFront Function $NAME-router"
FN_CODE="fileb://$ROOT/scripts/aws/cloudfront-function.js"
FN_CONFIG="Comment=$NAME redirects and index.html,Runtime=cloudfront-js-2.0"
if FN_ETAG="$(aws cloudfront describe-function --name "$NAME-router" --query ETag --output text 2>/dev/null)"; then
  FN_ETAG="$(aws cloudfront update-function --name "$NAME-router" --if-match "$FN_ETAG" \
    --function-config "$FN_CONFIG" --function-code "$FN_CODE" --query ETag --output text)"
else
  FN_ETAG="$(aws cloudfront create-function --name "$NAME-router" \
    --function-config "$FN_CONFIG" --function-code "$FN_CODE" --query ETag --output text)"
fi
FN_ARN="$(aws cloudfront publish-function --name "$NAME-router" --if-match "$FN_ETAG" \
  --query FunctionSummary.FunctionMetadata.FunctionARN --output text)"
echo "published $FN_ARN"

# 6. Distribution -----------------------------------------------------------------------------------------
log "CloudFront distribution '$NAME'"
DIST_ID="$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='$NAME'].Id | [0]" --output text)"
if [ "$DIST_ID" = "None" ] || [ -z "$DIST_ID" ]; then
  ORIGIN="$BUCKET.s3.$REGION.amazonaws.com"
  CONFIG="$(jq -n --arg ref "$NAME-$(date +%s)" --arg name "$NAME" --arg origin "$ORIGIN" --arg oac "$OAC_ID" --arg fn "$FN_ARN" '{
    CallerReference: $ref, Comment: $name, Enabled: true, DefaultRootObject: "index.html",
    HttpVersion: "http2and3", IsIPV6Enabled: true, PriceClass: "PriceClass_100",
    Origins: { Quantity: 1, Items: [{ Id: "s3-site", DomainName: $origin, OriginAccessControlId: $oac,
      S3OriginConfig: { OriginAccessIdentity: "" } }] },
    DefaultCacheBehavior: {
      TargetOriginId: "s3-site", ViewerProtocolPolicy: "redirect-to-https", Compress: true,
      CachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6",
      AllowedMethods: { Quantity: 2, Items: ["GET", "HEAD"], CachedMethods: { Quantity: 2, Items: ["GET", "HEAD"] } },
      FunctionAssociations: { Quantity: 1, Items: [{ EventType: "viewer-request", FunctionARN: $fn }] } },
    CustomErrorResponses: { Quantity: 2, Items: [
      { ErrorCode: 403, ResponsePagePath: "/404.html", ResponseCode: "404", ErrorCachingMinTTL: 60 },
      { ErrorCode: 404, ResponsePagePath: "/404.html", ResponseCode: "404", ErrorCachingMinTTL: 60 } ] } }')"
  DIST_ID="$(aws cloudfront create-distribution --distribution-config "$CONFIG" --query Distribution.Id --output text)"
  aws cloudfront tag-resource --resource "arn:aws:cloudfront::$ACCOUNT_ID:distribution/$DIST_ID" \
    --tags "Items=[{Key=Project,Value=clp},{Key=Stage,Value=$STAGE}]"
  echo "created $DIST_ID (first deployment takes a few minutes to reach all edge locations)"
  NEW_DIST=1
fi
DOMAIN="$(aws cloudfront get-distribution --id "$DIST_ID" --query Distribution.DomainName --output text)"

# 7. Bucket policy: only this distribution may read ----------------------------------------------------------
log "Bucket policy"
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$(jq -n --arg b "$BUCKET" \
  --arg src "arn:aws:cloudfront::$ACCOUNT_ID:distribution/$DIST_ID" '{
  Version: "2012-10-17",
  Statement: [{ Sid: "AllowCloudFrontRead", Effect: "Allow", Principal: { Service: "cloudfront.amazonaws.com" },
    Action: "s3:GetObject", Resource: "arn:aws:s3:::\($b)/*", Condition: { StringEquals: { "AWS:SourceArn": $src } } }] }')"

# 8. Invalidate cached pages on re-deploys ---------------------------------------------------------------------
if [ -z "${NEW_DIST:-}" ]; then
  log "Invalidating CloudFront cache"
  aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" --query Invalidation.Id --output text
fi

log "Done"
echo "Distribution: $DIST_ID"
echo "URL:          https://$DOMAIN/"
