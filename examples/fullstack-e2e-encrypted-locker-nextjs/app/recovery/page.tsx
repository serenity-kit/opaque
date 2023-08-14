import RecoveryForm from "./RecoveryForm";

export default function Recovery() {
  return (
    <div className="p-12 space-y-8 text-gray-800 max-w-xl">
      <h1 className="text-xl font-semibold">Recover Locker</h1>
      <RecoveryForm />
      <div>
        <a href="/" className="text-blue-500 text-sm hover:underline">
          Go back
        </a>
      </div>
    </div>
  );
}
