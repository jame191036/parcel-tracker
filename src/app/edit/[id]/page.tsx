import AssetForm from "@/components/AssetForm";

export default function EditAssetPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <h2 className="mb-6 font-display text-lg font-medium text-foreground">
        แก้ไขรายการพัสดุ
      </h2>
      <AssetForm assetId={params.id} />
    </main>
  );
}