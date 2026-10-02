/**
 * Step 71 Production Astrologer Accounts & Onboarding Test Suite
 */

import { UserAccount, AstrologerProfile, AstrologerKycRecord } from '../../types';
import { AstrologerOnboardingService } from './astrologerOnboardingService';
import { InMemoryDataStore } from '../data/dataStore';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runAstrologerOnboardingIntegrationTest() {
  console.log('=== RUNNING STEP 71 ASTROLOGER ONBOARDING INTEGRATION TEST SUITE ===\n');

  const testStore = new InMemoryDataStore();
  const onboardingService = new AstrologerOnboardingService(testStore);

  // Users
  const astroUser: UserAccount = {
    id: `usr_astro_${Date.now()}`,
    displayName: 'Pandit Devendra',
    email: 'devendra@vedic.app',
    role: 'ASTROLOGER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  const clientUser: UserAccount = {
    id: `usr_client_${Date.now()}`,
    displayName: 'Client User',
    email: 'client@vedic.app',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  const adminUser: UserAccount = {
    id: `usr_admin_${Date.now()}`,
    displayName: 'System Admin',
    email: 'admin@vedic.app',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoUser: false,
  };

  await testStore.saveUser(astroUser);
  await testStore.saveUser(clientUser);
  await testStore.saveUser(adminUser);

  // Requirement 1, 2, 3, 4: Production Account Onboarding Submission & Initial PENDING Status
  const submitRes = await onboardingService.submitOnboardingApplication(astroUser, {
    name: 'Pandit Devendra Shastri',
    title: 'Senior Vedic & Vastu Specialist',
    bio: '20+ years practicing traditional Parashari Vedic astrology.',
    education: 'M.A. Jyotish, BHU Varanasi',
    skills: ['Kundli', 'Vastu', 'Prashna'],
    languages: ['Hindi', 'Sanskrit', 'English'],
    experienceYears: 20,
    perMinuteCharge: 40,
    documentType: 'Aadhaar',
    idNumberLast4: '4321',
    documentReference: 'storage/kyc/devendra_aadhaar.pdf',
  });

  assert(submitRes.success === true, 'Astrologer onboarding application submitted successfully');
  let createdAstroId = '';
  if (submitRes.success) {
    const { profile, kyc } = submitRes.data;
    createdAstroId = profile.id;
    assert(profile.userId === astroUser.id, 'Astrologer profile userId matches practitioner Firebase UID');
    assert(profile.status === 'PENDING', 'Initial application status is PENDING');
    assert(profile.isApproved === false, 'isApproved is false prior to admin review');
    assert(profile.isDemoUser === false, 'Production onboarding sets isDemoUser to false');
    assert(kyc.documentType === 'Aadhaar', 'KYC document type recorded as Aadhaar');
    assert(kyc.verificationStatus === 'PENDING', 'Initial KYC status is PENDING');
  }

  // Requirement 5, 11: Production Directory Filters Out PENDING Practitioners
  const pendingDir = await onboardingService.listDirectoryAstrologers(false);
  assert(pendingDir.length === 0, 'PENDING practitioner excluded from production public directory');

  // Requirement 8: KYC Access Protection (Normal Client Blocked)
  const clientKycRes = await onboardingService.getAstrologerKyc(clientUser, createdAstroId);
  assert(clientKycRes.success === false, 'Normal client blocked from reading sensitive practitioner KYC data');
  if (!clientKycRes.success) {
    assert(clientKycRes.code === 'UNAUTHORIZED_ACCESS', 'Returns UNAUTHORIZED_ACCESS code');
  }

  // Requirement 9, 10: Non-Admins Cannot Approve Onboarding Applications
  const clientApproveRes = await onboardingService.approveAstrologerApplication(clientUser, createdAstroId);
  assert(clientApproveRes.success === false, 'Client blocked from approving astrologer application');

  const selfApproveRes = await onboardingService.approveAstrologerApplication(astroUser, createdAstroId);
  assert(selfApproveRes.success === false, 'Astrologer blocked from approving own application');

  // Requirement 5: Admin Approval Workflow
  const adminApproveRes = await onboardingService.approveAstrologerApplication(adminUser, createdAstroId);
  assert(adminApproveRes.success === true, 'Admin successfully approved practitioner application');
  if (adminApproveRes.success) {
    assert(adminApproveRes.data.status === 'APPROVED', 'Updated status is APPROVED');
    assert(adminApproveRes.data.isApproved === true, 'isApproved flag set to true');
    assert(adminApproveRes.data.approvedBy === adminUser.id, 'approvedBy matches admin UID');
  }

  // Requirement 11: Approved Astrologer Now Visible in Production Directory
  const approvedDir = await onboardingService.listDirectoryAstrologers(false);
  assert(approvedDir.length === 1, 'APPROVED practitioner now visible in production public directory');
  assert(approvedDir[0].id === createdAstroId, 'Directory returns exact approved astrologer ID');

  // Requirement 14: Availability State Persistence
  const availRes = await onboardingService.updateAvailabilityStatus(astroUser, createdAstroId, 'ONLINE');
  assert(availRes.success === true, 'Astrologer updated availability status to ONLINE');
  if (availRes.success) {
    assert(availRes.data.availabilityStatus === 'ONLINE', 'availabilityStatus is ONLINE');
    assert(availRes.data.isOnline === true, 'isOnline boolean is true');
  }

  // Requirement 8: Owner Practitioner and Admin CAN Access KYC Data
  const ownerKycRes = await onboardingService.getAstrologerKyc(astroUser, createdAstroId);
  assert(ownerKycRes.success === true, 'Practitioner owner can access own KYC verification metadata');

  const adminKycRes = await onboardingService.getAstrologerKyc(adminUser, createdAstroId);
  assert(adminKycRes.success === true, 'Platform Admin can access practitioner KYC verification metadata');

  // Requirement 6: Admin Rejection Workflow
  const rejAstroRes = await onboardingService.submitOnboardingApplication(clientUser, {
    name: 'Incomplete Applicant',
    title: 'Beginner',
    bio: 'No experience',
    education: 'None',
    skills: [],
    languages: ['English'],
    experienceYears: 0,
    perMinuteCharge: 15,
    documentType: 'PAN',
  });

  if (rejAstroRes.success) {
    const rejAstroId = rejAstroRes.data.profile.id;
    const adminRejRes = await onboardingService.rejectAstrologerApplication(adminUser, rejAstroId, 'Insufficient professional credentials');
    assert(adminRejRes.success === true, 'Admin successfully rejected application');
    if (adminRejRes.success) {
      assert(adminRejRes.data.status === 'REJECTED', 'Status updated to REJECTED');
      assert(adminRejRes.data.isApproved === false, 'isApproved is false');
    }
  }

  // Requirement 7: Admin Suspension Workflow
  const suspendRes = await onboardingService.suspendAstrologerAccount(adminUser, createdAstroId, 'Policy compliance review');
  assert(suspendRes.success === true, 'Admin successfully suspended practitioner account');
  if (suspendRes.success) {
    assert(suspendRes.data.status === 'SUSPENDED', 'Status updated to SUSPENDED');
    assert(suspendRes.data.isApproved === false, 'isApproved set to false during suspension');
  }

  const suspendedDir = await onboardingService.listDirectoryAstrologers(false);
  assert(suspendedDir.length === 0, 'SUSPENDED practitioner excluded from public production directory');

  console.log('\n=== ALL STEP 71 ASTROLOGER ONBOARDING TESTS PASSED! ===');
}

runAstrologerOnboardingIntegrationTest().catch(err => {
  console.error('Astrologer onboarding integration test failed:', err);
  process.exit(1);
});
