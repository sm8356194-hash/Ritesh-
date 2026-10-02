import React, { useState, useMemo } from 'react';
import { AstrologerPanelTab, DemoClient, DemoConsultationItem, BirthProfile, ConsultationRecord } from '../../types';
import { DEMO_ASTROLOGER_PROFILE, INITIAL_DEMO_CLIENTS, INITIAL_DEMO_CONSULTATIONS } from '../../data/demoClients';
import { AstrologerHeader } from './AstrologerHeader';
import { AstrologerBottomNav } from './AstrologerBottomNav';
import { AstrologerDashboardTab } from './AstrologerDashboardTab';
import { AstrologerClientsTab } from './AstrologerClientsTab';
import { AstrologerClientProfileView } from './AstrologerClientProfileView';
import { AstrologerConsultationScreen } from './AstrologerConsultationScreen';
import { AstrologerConsultationsTab } from './AstrologerConsultationsTab';
import { AstrologerProfileTab } from './AstrologerProfileTab';

interface AstrologerPanelProps {
  clientBirthProfile: BirthProfile;
  onSwitchToClientApp: () => void;
  onSwitchToAdminPanel?: () => void;
}

export const AstrologerPanel: React.FC<AstrologerPanelProps> = ({
  clientBirthProfile,
  onSwitchToClientApp,
  onSwitchToAdminPanel,
}) => {
  const [activeTab, setActiveTab] = useState<AstrologerPanelTab>('dashboard');
  
  // Navigation states for detailed views
  const [selectedClientForProfile, setSelectedClientForProfile] = useState<DemoClient | null>(null);
  const [activeConsultationClient, setActiveConsultationClient] = useState<DemoClient | null>(null);
  const [activeConsultationRecord, setActiveConsultationRecord] = useState<ConsultationRecord | null>(null);

  // Synchronize active client app user's details into the demo clients store
  const clientsList = useMemo<DemoClient[]>(() => {
    return INITIAL_DEMO_CLIENTS.map((client) => {
      if (client.isCurrentAppUser && clientBirthProfile.name) {
        return {
          ...client,
          name: clientBirthProfile.name,
          dateOfBirth: clientBirthProfile.dateOfBirth,
          birthTime: clientBirthProfile.birthTime,
          birthTimeKnown: clientBirthProfile.birthTimeKnown,
          birthPlace: clientBirthProfile.birthPlace,
          city: clientBirthProfile.city,
          state: clientBirthProfile.state,
          country: clientBirthProfile.country,
          latitude: clientBirthProfile.latitude,
          longitude: clientBirthProfile.longitude,
          timezone: clientBirthProfile.timezone,
          gender: clientBirthProfile.gender,
        };
      }
      return client;
    });
  }, [clientBirthProfile]);

  const [consultations] = useState<DemoConsultationItem[]>(INITIAL_DEMO_CONSULTATIONS);

  // Handlers
  const handleOpenClientKundli = (client: DemoClient) => {
    setSelectedClientForProfile(client);
  };

  const handleOpenClientProfile = (client: DemoClient) => {
    setSelectedClientForProfile(client);
  };

  const handleStartActiveConsultation = (client: DemoClient) => {
    setActiveConsultationClient(client);
    setActiveConsultationRecord(null);
  };

  const handleOpenConsultationRecord = (cons: ConsultationRecord) => {
    setActiveConsultationRecord(cons);
    setActiveConsultationClient(null);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* 1. Specialized Astrologer Dashboard Header */}
      <AstrologerHeader
        astrologer={DEMO_ASTROLOGER_PROFILE}
        activeTab={activeTab}
        onSwitchToClientApp={onSwitchToClientApp}
        onSwitchToAdminPanel={onSwitchToAdminPanel}
        onOpenSettingsOrProfile={() => {
          setSelectedClientForProfile(null);
          setActiveConsultationClient(null);
          setActiveConsultationRecord(null);
          setActiveTab('profile');
        }}
      />

      {/* 2. Main Workstation Body */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 relative">
        {/* Full-screen Mode: Active Consultation Screen */}
        {activeConsultationRecord || activeConsultationClient ? (
          <AstrologerConsultationScreen
            consultation={activeConsultationRecord || undefined}
            client={activeConsultationClient || undefined}
            onBack={() => {
              setActiveConsultationClient(null);
              setActiveConsultationRecord(null);
            }}
            onEndConsultation={() => {
              setActiveConsultationClient(null);
              setActiveConsultationRecord(null);
            }}
          />
        ) : selectedClientForProfile ? (
          /* Full-screen Mode: Client Profile with Tabs [OVERVIEW] [KUNDLI] [HISTORY] [NOTES] */
          <AstrologerClientProfileView
            client={selectedClientForProfile}
            consultations={consultations}
            onBack={() => setSelectedClientForProfile(null)}
            onStartConsultation={(c) => {
              setSelectedClientForProfile(null);
              setActiveConsultationClient(c);
              setActiveConsultationRecord(null);
            }}
          />
        ) : (
          /* Standard Astrologer Panel Navigation Views */
          <>
            {activeTab === 'dashboard' && (
              <AstrologerDashboardTab
                clients={clientsList}
                consultations={consultations}
                onOpenClientKundli={handleOpenClientKundli}
                onOpenClientProfile={handleOpenClientProfile}
                onStartActiveConsultation={handleStartActiveConsultation}
                onNavigateToClients={() => setActiveTab('clients')}
                onNavigateToConsultations={() => setActiveTab('consultations')}
              />
            )}

            {activeTab === 'clients' && (
              <AstrologerClientsTab
                clients={clientsList}
                onOpenClientKundli={handleOpenClientKundli}
                onOpenClientProfile={handleOpenClientProfile}
                onStartActiveConsultation={handleStartActiveConsultation}
              />
            )}

            {activeTab === 'consultations' && (
              <AstrologerConsultationsTab
                consultations={consultations}
                clients={clientsList}
                onStartConsultationWithClient={handleStartActiveConsultation}
                onOpenConsultationSession={handleOpenConsultationRecord}
              />
            )}

            {activeTab === 'profile' && (
              <AstrologerProfileTab
                onSwitchToClientApp={onSwitchToClientApp}
              />
            )}
          </>
        )}
      </main>

      {/* 3. Specialized Astrologer Bottom Navigation: Dashboard | Clients | Consultations | Profile */}
      {!activeConsultationClient && !activeConsultationRecord && !selectedClientForProfile && (
        <AstrologerBottomNav
          activeTab={activeTab}
          onNavigateTab={(tab) => {
            setSelectedClientForProfile(null);
            setActiveConsultationClient(null);
            setActiveConsultationRecord(null);
            setActiveTab(tab);
          }}
        />
      )}
    </div>
  );
};
