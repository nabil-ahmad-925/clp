'use client';

import { useState } from 'react';
import BecomePartner from '@/components/partners/BecomePartner';
import PartnerSignIn from './PartnerSignIn';
import st from './requestStage.module.css';

/**
 * Designing (artwork on each print spot, the asset library, the studio) is for approved CLP partners. A guest signs in
 * or applies; a signed-in member applies. Either can still ask for a quote and send their logo files right after it.
 */
export default function DesignGate({ member }: { member: boolean }) {
  const [signIn, setSignIn] = useState(false);
  return (
    <div className={st.box} data-on="true">
      <strong>DESIGNING IS FOR CLP PARTNERS</strong>
      <span>
        {member ? 'Your member account can ask for quotes. ' : ''}Approved CLP partners design their gear here. Ask for your quote below and send your logo files right after it, and our designers set it up with you.
      </span>
      <span className={st.acts}>
        {!member && (
          <button type="button" className={st.dark} onClick={() => setSignIn(true)}>
            Partner Sign In
          </button>
        )}
        <BecomePartner className={member ? st.dark : st.light}>Become a Partner</BecomePartner>
      </span>
      {signIn && <PartnerSignIn onClose={() => setSignIn(false)} onSignedIn={() => setSignIn(false)} />}
    </div>
  );
}
