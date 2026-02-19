import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Instagram, Facebook, Music2, Camera, Link, Globe, 
  AlertTriangle, Loader2, Save, Upload, MapPin, Info, User 
} from 'lucide-react';
import { CLIENT_ID, BUSINESS_INFO } from '../../constants';
import { SocialLinks } from '../../types';

const DashboardDesign: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: '', facebook: '', tiktok: '', whatsapp: ''
  });
  const [gallery, setGallery] = useState<string[]>(Array(8).fill(''));
  const [mapAddress, setMapAddress] = useState('');

  // Carregar dados existentes do Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "businesses", CLIENT_ID, "config", "metadata"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.socialLinks) setSocialLinks(data.socialLinks);
        if (data.galleryUrls) setGallery(data.galleryUrls);
        if (data.mapAddress) setMapAddress(data.mapAddress);
      }
    });
    return () => unsub();
  }, []);

  const getMapIframeUrl = () => {
    const query = mapAddress || `${BUSINESS_INFO.address}, ${BUSINESS_INFO.city}`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  const handleSaveMetadata = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "businesses", CLIENT_ID, "config", "metadata"), {
        socialLinks,
        mapAddress,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("Configurações de Design e Mapa guardadas!");
    } catch (e) { 
      console.error(e);
      alert("Erro ao salvar dados."); 
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. VALIDAÇÃO FLEXÍVEL: Aceita JPG, PNG e WEBP
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Formato inválido. Por favor, utilize imagens JPG, PNG ou WEBP.");
      return;
    }

    setUploadingIdx(index);
    try {
      // 2. EXTRAIR A EXTENSÃO REAL DO FICHEIRO
      const extension = file.name.split('.').pop() || 'jpg';
      
      // Caminho no Storage organizado por CLIENT_ID com a extensão correta
      const storageRef = ref(storage, `businesses/${CLIENT_ID}/gallery/slot_${index}.${extension}`);
      
      // Fazer o upload
      await uploadBytes(storageRef, file);
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
      alert("Erro no upload da imagem. Tente novamente.");
    }
    setUploadingIdx(null);
  };

  // Função auxiliar para dar dicas de UX nos slots de fotos
  const getSlotUX = (idx: number) => {
    if (idx === 0) return { title: "Banner (Fundo)", icon: <Camera size={32} className="text-stone-700" />, border: "border-stone-600 border-dashed bg-stone-900" };
    if (idx === 4) return { title: "Foto de Perfil", icon: <User size={32} className="text-[#b5967a]" />, border: "border-[#b5967a] border-solid bg-[#b5967a]/5 shadow-[0_0_15px_rgba(181,150,122,0.1)]" };
    if (idx >= 5) return { title: `Foto do Espaço ${idx - 4}`, icon: <Camera size={32} className="text-stone-800" />, border: "border-white/10 border-dashed bg-stone-950" };
    return { title: `Trabalho ${idx + 1}`, icon: <Camera size={32} className="text-stone-800" />, border: "border-white/10 border-dashed bg-stone-950" };
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 font-sans">
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Painel de Inputs (Esquerda) */}
        <div className="bg-stone-900 border border-[#b5967a]/20 p-8 rounded-[3rem] shadow-2xl space-y-6">
          <h3 className="text-white font-bold flex items-center gap-3 text-lg">
            <Globe className="text-[#b5967a]"/> Redes e Localização
          </h3>
          
          <div className="space-y-5">
            {/* INPUT GOOGLE MAPS COM INSTRUÇÃO */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black text-stone-500 ml-1 tracking-widest flex items-center gap-2">
                <MapPin size={12} className="text-[#b5967a]" /> Ponto no Google Maps
              </label>
              <input 
                placeholder="Ex: Stacy Costa Nails Algés"
                className="w-full bg-stone-950 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none focus:border-[#b5967a] transition-all text-sm"
                value={mapAddress}
                onChange={(e) => setMapAddress(e.target.value)}
              />
              <div className="flex gap-2 px-2">
                <Info size={14} className="text-[#b5967a] shrink-0 mt-0.5" />
                <p className="text-[11px] text-stone-500 leading-relaxed italic">
                  Escreva o nome comercial registado no Google ou a morada completa (Rua, Número e Localidade). O mapa à direita irá mostrar o resultado em tempo real.
                </p>
              </div>
            </div>

            {/* REDES SOCIAIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-stone-500 ml-1">Instagram</label>
                  <input 
                    placeholder="Link do perfil"
                    className="w-full bg-stone-950 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-[#b5967a]"
                    value={socialLinks.instagram || ''}
                    onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-stone-500 ml-1">TikTok</label>
                  <input 
                    placeholder="Link do TikTok"
                    className="w-full bg-stone-950 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-[#b5967a]"
                    value={socialLinks.tiktok || ''}
                    onChange={(e) => setSocialLinks({...socialLinks, tiktok: e.target.value})}
                  />
               </div>
               <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] uppercase font-black text-stone-500 ml-1">Facebook</label>
                  <input 
                    placeholder="Link da página"
                    className="w-full bg-stone-950 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-[#b5967a]"
                    value={socialLinks.facebook || ''}
                    onChange={(e) => setSocialLinks({...socialLinks, facebook: e.target.value})}
                  />
               </div>
            </div>

            <button 
              onClick={handleSaveMetadata}
              disabled={loading}
              className="w-full py-5 mt-4 bg-[#b5967a] hover:bg-[#a38569] text-white font-black rounded-2xl transition-all flex justify-center items-center gap-2 shadow-xl shadow-[#b5967a]/10 active:scale-95 uppercase tracking-widest text-xs"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Guardar Configurações</>}
            </button>
          </div>
        </div>

        {/* Pré-visualização do Mapa (Direita) */}
        <div className="bg-stone-900 border border-[#b5967a]/20 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl group">
          <div className="p-6 bg-stone-900/50 border-b border-white/5 flex items-center justify-between">
            <h4 className="text-white font-bold text-sm flex items-center gap-2">
              <MapPin size={16} className="text-[#b5967a]" /> Pré-visualização do Mapa
            </h4>
            <div className="px-3 py-1 rounded-full bg-[#b5967a]/10 border border-[#b5967a]/20 text-[#b5967a] text-[9px] font-black uppercase tracking-tighter">
              Ao vivo
            </div>
          </div>
          
          <div className="flex-1 bg-stone-950 min-h-[300px] relative">
            <iframe 
              src={getMapIframeUrl()} 
              width="100%" 
              height="100%" 
              style={{ border: 0, filter: 'grayscale(0.5) contrast(1.2)' }} 
              allowFullScreen={true} 
              loading="lazy"
              title="Preview Google Maps"
              className="group-hover:grayscale-0 transition-all duration-1000"
            />
          </div>
        </div>
      </div>

      {/* Galeria de Fotos */}
      <div className="bg-stone-900 border border-[#b5967a]/20 p-8 rounded-[3rem] shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h3 className="text-white font-bold flex items-center gap-3 text-lg uppercase tracking-widest">
            <Camera className="text-[#b5967a]"/> O Meu Portfolio
          </h3>
          <div className="flex items-center gap-2 text-stone-500 bg-stone-950 px-4 py-2 rounded-full border border-white/5">
            <AlertTriangle size={14} className="text-[#b5967a]" />
            <span className="text-[10px] font-bold uppercase">Formatos: JPG, PNG, WEBP</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {gallery.map((url, idx) => {
            const ux = getSlotUX(idx);
            return (
              <div key={idx} className="relative group">
                <label className="cursor-pointer block relative">
                  
                  {/* Etiqueta de Destaque no Topo */}
                  {idx === 4 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#b5967a] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full z-10 shadow-lg whitespace-nowrap">
                      Sobre Mim
                    </div>
                  )}

                  {/* 3. HTML ATUALIZADO: Agora permite jpg, jpeg e png na janela de seleção do Windows/Mac */}
                  <input 
                    type="file" 
                    accept="image/webp, image/jpeg, image/png" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, idx)}
                    disabled={uploadingIdx !== null}
                  />
                  <div className={`aspect-[4/5] border rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-3 hover:border-[#b5967a]/50 transition-all relative ${ux.border}`}>
                    {url ? (
                      <>
                        <img src={url} alt={`Slot ${idx + 1}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="bg-[#b5967a] p-3 rounded-full text-white shadow-2xl scale-110">
                              <Upload size={20} />
                           </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {ux.icon}
                        <span className={`text-[10px] font-black uppercase tracking-widest text-center px-2 ${idx === 4 ? 'text-[#b5967a]' : 'text-stone-600'}`}>
                          {ux.title}
                        </span>
                      </>
                    )}

                    {uploadingIdx === idx && (
                      <div className="absolute inset-0 bg-stone-950/80 flex items-center justify-center backdrop-blur-sm z-50">
                        <Loader2 className="animate-spin text-[#b5967a]" size={32} />
                      </div>
                    )}
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardDesign;