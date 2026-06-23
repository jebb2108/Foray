import { ApiUserProfile } from '../../../shared/api/contracts';
import { apiRequest } from '../../../shared/api/httpClient';
import { UserProfileChanges } from '../model/userProfile';

export const profileApi = {
  getCurrentUser() {
    return apiRequest<ApiUserProfile>('/users/me');
  },

  updateProfile(userId: string, changes: UserProfileChanges) {
    return apiRequest<ApiUserProfile, UserProfileChanges>(
      `/users/${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        body: changes,
      },
    );
  },

  updateInterests(userId: string, interestIds: string[]) {
    return apiRequest<ApiUserProfile, { interestIds: string[] }>(
      `/users/${encodeURIComponent(userId)}/interests`,
      {
        method: 'PUT',
        body: { interestIds },
      },
    );
  },
};
