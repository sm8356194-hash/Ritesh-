import React from 'react';
import { UserBirthDetails, DashboardSection } from '../../types';
import { AiAstrologerView } from './AiAstrologerView';

interface AiAstrologerProps {
  userDetails: UserBirthDetails;
  onClose?: () => void;
  onNavigateSection?: (section: DashboardSection) => void;
}

export const AiAstrologerModal: React.FC<AiAstrologerProps> = ({ 
  userDetails, 
  onClose,
  onNavigateSection 
}) => {
  return (
    <AiAstrologerView
      userDetails={userDetails}
      onBack={onClose || (() => {})}
      onNavigateSection={onNavigateSection}
    />
  );
};
