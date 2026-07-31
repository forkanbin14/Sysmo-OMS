export interface ThemePreset {
  key: string;
  name: string;
  description: string;
  accent: string;
  bg: string;
  sidebar: string;
  preview: string[];
}

export const THEME_PRESETS: ThemePreset[] = [
  { key: 'atlas-midnight', name: 'Atlas Midnight', description: 'Deep navy with indigo accents', accent: '#4f46e5', bg: '#0a0e1a', sidebar: '#0f1421', preview: ['#0a0e1a', '#4f46e5', '#6366f1'] },
  { key: 'ocean-azure', name: 'Ocean Azure', description: 'Calm blue with cyan highlights', accent: '#0ea5e9', bg: '#0c1929', sidebar: '#0f1f33', preview: ['#0c1929', '#0ea5e9', '#38bdf8'] },
  { key: 'emerald-pro', name: 'Emerald Pro', description: 'Professional green palette', accent: '#10b981', bg: '#0a1f14', sidebar: '#0f291b', preview: ['#0a1f14', '#10b981', '#34d399'] },
  { key: 'sunset-coral', name: 'Sunset Coral', description: 'Warm coral with orange tones', accent: '#f97316', bg: '#1a0f0a', sidebar: '#29180f', preview: ['#1a0f0a', '#f97316', '#fb923c'] },
  { key: 'rose-gold', name: 'Rose Gold', description: 'Elegant rose with gold accents', accent: '#e11d48', bg: '#1a0a12', sidebar: '#290f1a', preview: ['#1a0a12', '#e11d48', '#fb7185'] },
  { key: 'graphite-slate', name: 'Graphite Slate', description: 'Neutral slate with steel blue', accent: '#64748b', bg: '#0f1115', sidebar: '#161920', preview: ['#0f1115', '#64748b', '#94a3b8'] },
  { key: 'royal-sapphire', name: 'Royal Sapphire', description: 'Deep blue with sapphire highlights', accent: '#2563eb', bg: '#0a1020', sidebar: '#0f1830', preview: ['#0a1020', '#2563eb', '#3b82f6'] },
  { key: 'forest-pine', name: 'Forest Pine', description: 'Natural pine greens', accent: '#16a34a', bg: '#0a1a10', sidebar: '#0f2418', preview: ['#0a1a10', '#16a34a', '#22c55e'] },
  { key: 'amber-lux', name: 'Amber Lux', description: 'Luxurious amber and gold', accent: '#d97706', bg: '#1a140a', sidebar: '#29200f', preview: ['#1a140a', '#d97706', '#f59e0b'] },
  { key: 'crimson-elite', name: 'Crimson Elite', description: 'Bold crimson with dark base', accent: '#dc2626', bg: '#1a0a0a', sidebar: '#291010', preview: ['#1a0a0a', '#dc2626', '#ef4444'] },
  { key: 'violet-noir', name: 'Violet Noir', description: 'Dark violet with purple accents', accent: '#7c3aed', bg: '#120a1a', sidebar: '#1a0f29', preview: ['#120a1a', '#7c3aed', '#8b5cf6'] },
  { key: 'teal-fusion', name: 'Teal Fusion', description: 'Modern teal with mint', accent: '#14b8a6', bg: '#0a1a1a', sidebar: '#0f2424', preview: ['#0a1a1a', '#14b8a6', '#2dd4bf'] },
  { key: 'midnight-plum', name: 'Midnight Plum', description: 'Rich plum with pink accents', accent: '#a855f7', bg: '#150a1a', sidebar: '#1f0f29', preview: ['#150a1a', '#a855f7', '#c084fc'] },
  { key: 'steel-indigo', name: 'Steel Indigo', description: 'Industrial steel with indigo', accent: '#4338ca', bg: '#0d0f1a', sidebar: '#121524', preview: ['#0d0f1a', '#4338ca', '#6366f1'] },
  { key: 'sage-wellness', name: 'Sage Wellness', description: 'Calming sage green', accent: '#84cc16', bg: '#10150a', sidebar: '#182010', preview: ['#10150a', '#84cc16', '#a3e635'] },
  { key: 'obsidian-gold', name: 'Obsidian Gold', description: 'Black with premium gold', accent: '#ca8a04', bg: '#0a0a0a', sidebar: '#141414', preview: ['#0a0a0a', '#ca8a04', '#eab308'] },
  { key: 'arctic-frost', name: 'Arctic Frost', description: 'Cool ice blue tones', accent: '#0284c7', bg: '#0a1419', sidebar: '#0f1f26', preview: ['#0a1419', '#0284c7', '#0ea5e9'] },
  { key: 'copper-warmth', name: 'Copper Warmth', description: 'Earthy copper tones', accent: '#ea580c', bg: '#1a0f08', sidebar: '#29180f', preview: ['#1a0f08', '#ea580c', '#f97316'] },
  { key: 'mono-elegant', name: 'Mono Elegant', description: 'Pure monochrome with white accent', accent: '#e5e7eb', bg: '#0a0a0a', sidebar: '#121212', preview: ['#0a0a0a', '#e5e7eb', '#f3f4f6'] },
  { key: 'berry-deep', name: 'Berry Deep', description: 'Deep berry with fuchsia', accent: '#c026d3', bg: '#150a15', sidebar: '#1f0f1f', preview: ['#150a15', '#c026d3', '#d946ef'] },
  { key: 'cyber-neon', name: 'Cyber Neon', description: 'Futuristic neon green', accent: '#22c55e', bg: '#050a05', sidebar: '#0a120a', preview: ['#050a05', '#22c55e', '#4ade80'] },
  { key: 'pearl-soft', name: 'Pearl Soft', description: 'Soft pearl with sky accents', accent: '#38bdf8', bg: '#0c0f14', sidebar: '#111720', preview: ['#0c0f14', '#38bdf8', '#7dd3fc'] },
];

export interface FontOption {
  key: string;
  name: string;
  family: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { key: 'inter', name: 'Inter', family: "'Inter', system-ui, sans-serif" },
  { key: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif" },
  { key: 'dm-sans', name: 'DM Sans', family: "'DM Sans', sans-serif" },
  { key: 'space-grotesk', name: 'Space Grotesk', family: "'Space Grotesk', sans-serif" },
  { key: 'manrope', name: 'Manrope', family: "'Manrope', sans-serif" },
  { key: 'plus-jakarta', name: 'Plus Jakarta', family: "'Plus Jakarta Sans', sans-serif" },
  { key: 'jetbrains', name: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
];

export interface IconSetOption {
  key: string;
  name: string;
  description: string;
}

export const ICON_SETS: IconSetOption[] = [
  { key: 'lucide', name: 'Lucide', description: 'Clean, modern line icons (default)' },
  { key: 'lucide-bold', name: 'Lucide Bold', description: 'Thicker stroke weight' },
  { key: 'lucide-rounded', name: 'Lucide Rounded', description: 'Rounded, friendly appearance' },
];
