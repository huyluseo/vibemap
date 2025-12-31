
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { storage, database } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { ref as dbRef, update } from "firebase/database";
import { updateProfile } from "firebase/auth";
import { X, Camera, Loader2, User } from "lucide-react";
import imageCompression from "browser-image-compression";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user } = useAuth();
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

            // 1. Upload Avatar if selected
            if (selectedFile) {
                // Compress Image
                const options = {
                    maxSizeMB: 0.5, // Max 500KB
                    maxWidthOrHeight: 1024, // Max width/height
                    useWebWorker: true,
                    fileType: "image/jpeg"
                };

                let fileToUpload = selectedFile;
                try {
                    console.log("Compressing image...");
                    fileToUpload = await imageCompression(selectedFile, options);
                    console.log(`Original: ${selectedFile.size / 1024 / 1024} MB, Compressed: ${fileToUpload.size / 1024 / 1024} MB`);
                } catch (err) {
                    console.error("Compression failed, using original:", err);
                }

                // Rename to strict format: avatars/{uid}.jpg
                // This overwrites previous avatar to save space
                const fileRef = storageRef(storage, `avatars/${user.uid}.jpg`);
                await uploadBytes(fileRef, fileToUpload);
                photoURL = await getDownloadURL(fileRef);
            }

            // 2. Update Auth Profile
            await updateProfile(user, {
                displayName: displayName,
                photoURL: photoURL,
            });

            // 3. Update Realtime DB
            const userRef = dbRef(database, `users/${user.uid}`);
            await update(userRef, {
                name: displayName,
                photoURL: photoURL,
                lastUpdated: Date.now(),
            });

            onClose();
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1A1A1A] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-white/70 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-6">

                    {/* Avatar Upload */}
                    <div className="flex justify-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full border-2 border-vibe-primary overflow-hidden bg-vibe-dark/50 flex items-center justify-center">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-white/50" />
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
                        <label className="text-xs font-medium text-vibe-text-secondary uppercase tracking-wider">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-vibe-primary focus:ring-1 focus:ring-vibe-primary transition-all"
                            placeholder="Enter your name"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 flex gap-3 justify-end bg-white/5">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !displayName.trim()}
                        className="px-6 py-2 rounded-lg text-sm font-medium bg-vibe-primary text-black hover:bg-vibe-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </button>
                </div>

            </div>
        </div>
    );
}
