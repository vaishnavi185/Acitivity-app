import { ProfileSavedView } from "@/src/components/profile/ProfileSavedView";

export const instant = false;

export const metadata = {
  title: 'Profile & Saved | GatherUp',
  description: 'View your profile and bookmarked social activities.',
};

export default function ProfilePage() {
  return <ProfileSavedView />;
}