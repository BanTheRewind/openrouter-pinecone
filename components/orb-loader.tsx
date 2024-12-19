"use client";
import { Player } from "@lottiefiles/react-lottie-player";

export default function OrbLoader({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="size-6">
                <Player
                    autoplay
                    loop
                    src="/ai-orb.json"
                    className="size-full"
                />
            </div>
        </div>
    );
}
