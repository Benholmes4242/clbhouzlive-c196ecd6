import React from 'react';
import { LegalShell, H2, P, UL } from './LegalShell';

const PrivacyPolicyPage: React.FC = () => (
  <LegalShell title="Privacy Policy">
    <P>
      clbhouz is operated by CLBHOUZ LTD, a company registered in England and Wales ("clbhouz", "we", "us").
      This policy explains what personal data we collect when you use the clbhouz app and website, how we use it,
      and the rights you have over it. We are the data controller for this data. You can contact us about
      anything in this policy at support@clbhouz.co.uk.
    </P>

    <H2>What we collect</H2>
    <UL>
      <li>Account details: your email address, chosen username, first and last name, gender, country, and optional profile details such as a photo, bio, city, and home club.</li>
      <li>Sign-in data: if you sign in with Apple or Google, we receive your email address and name from that provider. We never see your Apple or Google password.</li>
      <li>Golf data: scores, rounds, and handicap records, including data you choose to sync from your national golf union account (for example England Golf / WHS records), plus course ratings and reviews you post.</li>
      <li>Content: posts, photos, videos, comments, messages, and reactions you create in the app.</li>
      <li>Technical data: device type, app version, push notification tokens, and usage analytics (such as which screens are used) so we can fix problems and improve the product.</li>
    </UL>

    <H2>How we use it</H2>
    <UL>
      <li>To provide the service: accounts, profiles, feeds, messaging, handicap tracking, course discovery, and competitions.</li>
      <li>To send service emails such as sign-in codes and, if you join the launch list or opt in, product updates. You can unsubscribe from marketing at any time.</li>
      <li>To send push notifications you have enabled. These can be turned off in your device settings.</li>
      <li>To keep clbhouz safe: preventing abuse, enforcing our Terms, and securing accounts.</li>
      <li>Our legal bases under UK GDPR are performance of our contract with you, our legitimate interests in running and improving the service, and your consent where we ask for it (for example marketing emails).</li>
    </UL>

    <H2>Who we share it with</H2>
    <P>
      We do not sell your personal data. We use a small number of service providers to run clbhouz: Supabase
      (database and authentication), Resend (email delivery), Cloudflare (media hosting and delivery), OneSignal
      (push notifications), and Apple and Google (sign-in, if you choose those methods). Each processes data on
      our instructions. Content you post publicly (such as posts, reviews, and your profile) is visible to other
      clbhouz users.
    </P>

    <H2>How long we keep it</H2>
    <P>
      We keep your data while your account is active. If you delete your account in the app, your account data is
      deleted; some content may be anonymised rather than removed where it forms part of other users' experience
      (for example course rating averages). We may retain limited records where the law requires it.
    </P>

    <H2>Your rights</H2>
    <P>
      You can access, correct, export, or delete your personal data. Most of this can be done directly in the app
      (Edit Profile, Settings, Delete Account); for anything else email support@clbhouz.co.uk. You also have the
      right to complain to the UK Information Commissioner's Office (ico.org.uk).
    </P>

    <H2>Age</H2>
    <P>clbhouz is not intended for children under 13, and you must be at least 13 to create an account.</P>

    <H2>Changes</H2>
    <P>
      If we make material changes to this policy we will notify you in the app or by email. Continued use of
      clbhouz after changes take effect means you accept the updated policy.
    </P>
  </LegalShell>
);

export default PrivacyPolicyPage;
