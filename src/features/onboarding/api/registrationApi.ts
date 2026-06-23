import { apiRequest } from '../../../shared/api/httpClient';
import { ApiUserProfile } from '../../../shared/api/contracts';
import { UserProfileDraft } from '../../profile/model/userProfile';

export interface UsernameAvailabilityResponse {
  username: string;
  available: boolean;
}

export interface CompleteRegistrationRequest extends UserProfileDraft {
  birthDate: string;
}

export const registrationApi = {
  checkUsername(username: string, signal?: AbortSignal) {
    return apiRequest<UsernameAvailabilityResponse>(
      `/registration/username?username=${encodeURIComponent(username.replace(/^@/, ''))}`,
      { signal },
    );
  },

  createUser(payload: CompleteRegistrationRequest) {
    return apiRequest<ApiUserProfile, CompleteRegistrationRequest>('/registration/users', {
      method: 'POST',
      body: payload,
    });
  },

  completeOnboarding(userId: string, interestIds: string[]) {
    return apiRequest<ApiUserProfile, { interestIds: string[] }>(
      `/registration/users/${encodeURIComponent(userId)}/complete`,
      {
        method: 'POST',
        body: { interestIds },
      },
    );
  },
};
