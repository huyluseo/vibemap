
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { storage, database } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { ref as dbRef, update } from "firebase/database";
import { updateProfile } from "firebase/auth";
import { X, Camera, Loader2, User, Globe, Moon, Sun, Laptop } from "lucide-react";
import imageCompression from "browser-image-compression";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const { theme, setTheme, resolvedTheme } = useTheme();

    const [displayName, setDisplayName] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user && isOpen) {
            setDisplayName(user.displayName || user.email?.split("@")[0] || "");
            setPreviewUrl(user.photoURL);
            setSelectedFile(null);
        }
    }, [user, isOpen]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            let photoURL = user.photoURL;

            if (selectedFile) {
                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                    fileType: "image/jpeg"
                };

                let fileToUpload = selectedFile;
                try {
                    fileToUpload = await imageCompression(selectedFile, options);
                } catch (err) {
                    console.error("Compression failed:", err);
                }

                const fileRef = storageRef(storage, `avatars/${user.uid}.jpg`);
                await uploadBytes(fileRef, fileToUpload);
                photoURL = await getDownloadURL(fileRef);
            }

            await updateProfile(user, {
                displayName: displayName,
                photoURL: photoURL,
            });

            const userRef = dbRef(database, `users/${user.uid}`);
            await update(userRef, {
                name: displayName,
                photoURL: photoURL,
                lastUpdated: Date.now(),
            });

            onClose();
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    const bgColor = resolvedTheme === 'light' ? 'bg-white' : 'bg-[#1E1E1E]';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`${bgColor} w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">{t('profile.title')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 flex flex-col gap-6 overflow-y-auto">

                    {/* Avatar Upload */}
                    <div className="flex justify-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full border-2 border-primary overflow-hidden bg-muted flex items-center justify-center">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-muted-foreground" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white w-6 h-6" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('profile.display_name')}</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder={t('profile.display_name')}
                        />
                    </div>

                    <div className="h-[1px] bg-border w-full my-2"></div>

                    {/* LANGUAGE SETTINGS */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Globe className="w-3 h-3" /> {t('profile.language')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${language === 'en'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-input border-transparent text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage('vi')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${language === 'vi'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-input border-transparent text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                Tiếng Việt
                            </button>
                        </div>
                    </div>

                    {/* THEME SETTINGS */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Laptop className="w-3 h-3" /> {t('profile.theme')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setTheme('light')}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium border transition-all ${theme === 'light'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-input border-transparent text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                <Sun className="w-4 h-4" />
                                {t('profile.light')}
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium border transition-all ${theme === 'dark'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-input border-transparent text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                <Moon className="w-4 h-4" />
                                {t('profile.dark')}
                            </button>
                            <button
                                onClick={() => setTheme('system')}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium border transition-all ${theme === 'system'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-input border-transparent text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                <Laptop className="w-4 h-4" />
                                {t('profile.system')}
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex gap-3 justify-end bg-muted/20">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !displayName.trim()}
                        className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
                    </button>
                </div>

            </div>
        </div>
    );
}
