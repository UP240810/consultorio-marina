import PatientForm from "@/components/PatientForm";

export default function NuevoPacientePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-plum">Nuevo paciente</h1>
      <PatientForm />
    </div>
  );
}
