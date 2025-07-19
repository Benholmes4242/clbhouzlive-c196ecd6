import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import GBITop100Modal from './GBITop100Modal';

const GBIButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="outline"
        className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Trophy className="h-4 w-4 mr-2" />
        GB&I
      </Button>

      <GBITop100Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};

export default GBIButton;