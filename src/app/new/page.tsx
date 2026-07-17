import AssetForm from "@/components/AssetForm";

export default function NewAssetPage() {
  return (
    <main>
      <h2 className="mb-6 font-display text-lg font-medium text-foreground">
        จดรายการพัสดุใหม่
      </h2>
      <AssetForm />
    </main>
  );
}
