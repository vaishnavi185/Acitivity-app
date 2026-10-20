import MyBuddiesPage from "@/src/components/dashboard/MyBuddiesPage";

export const instant = false;

export const metadata = {
  title: "My Buddies | GatherUp",
  description: "View your buddies and visit their profiles.",
};

export default function MyBuddiesRoute() {
  return <MyBuddiesPage />;
}
