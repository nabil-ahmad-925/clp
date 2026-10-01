// CloudFront Function (viewer request, cloudfront-js-2.0) for the static export in S3.
// - The original site's 301 redirects (keep in sync with siteRedirects in next.config.ts).
// - WordPress-style URLs: "/about-us" -> 301 "/about-us/", and "/about-us/" is served from "/about-us/index.html".
var REDIRECTS = {
  '/event-project-management/': '/services/event-project-management-services/',
  '/event-project-management/inquiry/': '/brand-product-development/inquiry/',
  '/event-project-management/articles/': '/brand-product-development/articles/',
  '/event-project-management/photos/': '/experiences/baseball/photos/',
};

function queryString(qs) {
  var parts = [];
  for (var key in qs) {
    var v = qs[key];
    if (v.multiValue) v.multiValue.forEach(function (m) { parts.push(key + (m.value ? '=' + m.value : '')); });
    else parts.push(key + (v.value ? '=' + v.value : ''));
  }
  return parts.length ? '?' + parts.join('&') : '';
}

function redirect(location) {
  return { statusCode: 301, statusDescription: 'Moved Permanently', headers: { location: { value: location } } };
}

function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var last = uri.substring(uri.lastIndexOf('/') + 1);

  // Page URLs always end in "/" (files such as /uploads/x.png or /__next._full.txt have an extension).
  if (last !== '' && last.indexOf('.') === -1) return redirect(uri + '/' + queryString(request.querystring));

  if (REDIRECTS[uri]) return redirect(REDIRECTS[uri] + queryString(request.querystring));

  if (uri.charAt(uri.length - 1) === '/') request.uri = uri + 'index.html';
  return request;
}
