import React from 'react';
import { LegalShell, H2, P } from './LegalShell';

const TermsPage: React.FC = () => (
  <LegalShell title="Terms of Service">
    <P>
      These terms are a contract between you and CLBHOUZ LTD, a company registered in England and Wales
      ("clbhouz", "we", "us"), covering your use of the clbhouz app and website. By creating an account you agree
      to them.
    </P>

    <H2>Your account</H2>
    <P>
      You must be at least 13 years old. You are responsible for the accuracy of the information on your account
      and for keeping access to your sign-in email secure. One account per person; accounts are for personal,
      non-commercial use unless we approve a business profile.
    </P>

    <H2>Your content</H2>
    <P>
      You own the content you post. By posting it you give clbhouz a non-exclusive, worldwide, royalty-free
      licence to host, display, and distribute it within the service so the app can work (for example showing
      your posts to your followers). You can delete your content at any time, which ends this licence except for
      copies already shared by other users or retained briefly in backups.
    </P>

    <H2>Acceptable use</H2>
    <P>
      Do not post content that is unlawful, infringing, hateful, harassing, sexually explicit, or deceptive. Do
      not impersonate others, scrape the service, attempt to break or probe its security, or misuse handicap and
      scoring features to submit false golf data. We may remove content or suspend accounts that break these
      rules.
    </P>

    <H2>Golf data</H2>
    <P>
      Handicap and score data shown in clbhouz, including data synced from national golf union systems, is
      provided for information and social purposes. It is not an official handicap certificate, and your golf
      union's records remain authoritative.
    </P>

    <H2>The service</H2>
    <P>
      clbhouz is provided "as is". We work hard to keep it available and accurate but do not guarantee
      uninterrupted service, and features may change as the product evolves. To the fullest extent permitted by
      law, our liability to you is limited to the amount you have paid us in the last 12 months (currently nil
      for free accounts). Nothing in these terms limits liability that cannot be limited under English law.
    </P>

    <H2>Ending things</H2>
    <P>
      You can delete your account at any time in Settings. We may suspend or close accounts that violate these
      terms or where required by law. Sections that by their nature should survive (such as content licences for
      already-shared copies and liability limits) survive closure.
    </P>

    <H2>General</H2>
    <P>
      These terms are governed by the laws of England and Wales, and the courts of England and Wales have
      exclusive jurisdiction. If a part of these terms is found unenforceable, the rest still applies. We may
      update these terms; material changes will be notified in the app or by email.
    </P>

    <P>Contact: support@clbhouz.co.uk</P>
  </LegalShell>
);

export default TermsPage;
