import { Heart, Star } from 'lucide-react';

export default function FooterMagic() {
  return (
    <footer className="mt-16 border-t border-white/70 bg-gradient-to-b from-white to-violet-50">
      <div className="mx-auto max-w-6xl px-4 py-10 text-center text-sm text-gray-600">
        <p className="flex items-center justify-center gap-2">
          Made with <Heart className="text-rose-500" size={16} /> and a sprinkle of <Star className="text-amber-500" size={16} /> magic.
        </p>
      </div>
    </footer>
  );
}
