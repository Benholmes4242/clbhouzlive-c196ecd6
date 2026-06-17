/**
 * BusinessCreatePage - Business profile wizard wrapper
 */
import { BusinessProfileWizard } from '@/components/profile/profile-wizard';

const BusinessCreatePage = () => {
  return (
    <div className="w-full md:max-w-[440px] md:mx-auto">
      <BusinessProfileWizard />
    </div>
  );
};

export default BusinessCreatePage;
