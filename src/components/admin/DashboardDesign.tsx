import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Instagram, Facebook, Music2, Camera, Link, Globe, 
  AlertTriangle, Loader2, Save, Upload, CheckCircle2 
} from 'lucide-react';
import { CLIENT_ID } from '../../constants';
import { SocialLinks } from '../../types';

const DashboardDesign: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: '', facebook: '', tiktok: '', whatsapp: ''
  });
  const [gallery, setGallery] = useState<string[]>(Array(8).fill(''));

  // Carregar dados existentes
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "businesses", CLIENT_ID, "config", "metadata"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.socialLinks) setSocialLinks(data.socialLinks);
        if (data.galleryUrls) setGallery(data.galleryUrls);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveSocials = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "businesses", CLIENT_ID, "config", "metadata"), {
        socialLinks,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("Redes Sociais atualizadas!");
    } catch (e) { alert("Erro ao salvar."); }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar formato (Aviso ao cliente)
    if (!file.type.includes('webp')) {
      alert("Por favor, use apenas imagens no formato .webp para garantir a velocidade do site.");
      return;
    }

    setUploadingIdx(index);
    try {
      // Caminho no Storage organizado por CLIENT_ID
      const storageRef = ref(storage, `businesses/${CLIENT_ID}/gallery/slot_${index}.webp`);
      
      // Fazer o upload
      await uploadBytes(storageRef, file);
      
      // Obter o link público
      const downloadURL = await getDownloadURL(storageRef);

      // Atualizar o Firestore
      const newGallery = [...gallery];
      newGallery[index] = downloadURL;
      
      await setDoc(doc(db, "businesses", CLIENT_ID, "config", "metadata"), {
        galleryUrls: newGallery,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setGallery(newGallery);
    } catch (error) {
      console.error(error);
      alert("Erro no upload. Tente novamente.");
    }
    setUploadingIdx(null);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4">
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Redes Sociais - Paleta Nude/Gold */}
        <div className="bg-stone-900 border border-[#b5967a]/20 p-8 rounded-[3rem] shadow-2xl space-y-6">
          <h3 className="text-white font-bold flex items-center gap-3 text-lg">
            <Globe className="text-[#b5967a]"/> Redes Sociais
          </h3>
          
          <div className="space-y-4">
            <div className="relative">
              <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b5967a]" size={18} />
              <input 
                placeholder="Link Instagram"
                className="w-full bg-stone-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-[#b5967a] transition-all"
                value={socialLinks.instagram}
                onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})}
              />
            </div>
            <div className="relative">
              <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b5967a]" size={18} />
              <input 
                placeholder="Link Facebook"
                className="w-full bg-stone-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-[#b5967a] transition-all"
                value={socialLinks.facebook}
                onChange={e => setSocialLinks({...socialLinks, facebook: e.target.value})}
              />
            </div>
            <div className="relative">
              <Music2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b5967a]" size={18} />
              <input 
                placeholder="Link TikTok"
                className="w-full bg-stone-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-[#b5967a] transition-all"
                value={socialLinks.tiktok}
                onChange={e => setSocialLinks({...socialLinks, tiktok: e.target.value})}
              />
            </div>
            <button 
              onClick={handleSaveSocials}
              disabled={loading}
              className="w-full py-4 bg-[#b5967a] hover:bg-[#a38569] text-white font-black rounded-2xl transition-all flex justify-center items-center gap-2 shadow-xl shadow-[#b5967a]/10"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Guardar Redes Sociais</>}
            </button>
          </div>
        </div>

        {/* Info Box Stylizada */}
        <div className="bg-[#b5967a]/5 border border-[#b5967a]/20 p-8 rounded-[3rem] flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-16 h-16 bg-[#b5967a]/10 rounded-full flex items-center justify-center text-[#b5967a]">
            <AlertTriangle size={32} />
          </div>
          <h4 className="text-white font-bold text-lg">Gestão de Imagens Profissional</h4>
          <p className="text-stone-400 text-sm leading-relaxed max-w-xs">
            Personalize a sua galeria clicando nos slots abaixo. Lembre-se que as imagens devem estar em formato <b>.webp</b> para manter o site rápido.
          </p>
        </div>
      </div>

      {/* Galeria de Fotos Real com Slots Dourados */}
      <div className="bg-stone-900 border border-[#b5967a]/20 p-8 rounded-[3rem] shadow-2xl">
        <h3 className="text-white font-bold flex items-center gap-3 text-lg mb-8">
          <Camera className="text-[#b5967a]"/> A Sua Galeria (8 Slots)
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gallery.map((url, idx) => (
            <div key={idx} className="relative group">
              <label className="cursor-pointer block">
                <input 
                  type="file" 
                  accept="image/webp" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, idx)}
                  disabled={uploadingIdx !== null}
                />
                <div className="aspect-[4/5] bg-stone-950 border border-dashed border-white/10 rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-2 hover:border-[#b5967a]/50 transition-all relative">
                  {url ? (
                    <>
                      <img src={url} alt={`Slot ${idx + 1}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="bg-[#b5967a] p-3 rounded-full text-white shadow-2xl">
                            <Upload size={20} />
                         </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="text-stone-800" size={32} />
                      <span className="text-[10px] font-black text-stone-700 uppercase tracking-widest">Slot {idx + 1}</span>
                    </>
                  )}

                  {/* Feedback de Upload Individual */}
                  {uploadingIdx === idx && (
                    <div className="absolute inset-0 bg-stone-950/80 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="animate-spin text-[#b5967a]" size={32} />
                    </div>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardDesign;