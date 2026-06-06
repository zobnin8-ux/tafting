import { TuftingApp } from "@/components/TuftingApp";
import { LocaleProvider } from "@/components/LocaleProvider";

export default function Home() {
  return (
    <LocaleProvider>
      <TuftingApp />
    </LocaleProvider>
  );
}
