import { PublicGallery } from "@/components/organisms/PublicGallery";

export default function GalleryPage() {
  return (
    <div>
      <div className="px-4 pt-6 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-deep-kraft">Gallery</h1>
        <p className="mt-1 text-sm text-warm-gray">Published posters from the team.</p>
      </div>
      <PublicGallery />
    </div>
  );
}
