"use client";

import { authClient } from "@/components/SessionProvider";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import FormInput from "@/components/FormInput";
import ErrorAlert from "@/components/ErrorAlert";
import CenteredCard from "@/components/CenteredCard";

export default function SignInPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        const searchParams = useSearchParams();
        const callbackURL = searchParams.get("callbackURL") || "/";
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await authClient.signIn.username({
                username,
                password,
                callbackURL,
            });
            // better-auth handles the redirect automatically
        } catch (err: any) {
            setError(err.message || "Failed to sign in. Please check your credentials.");
            setIsLoading(false);
        }
    };

    return (
        <CenteredCard title="Sign in to your account">
            <Suspense>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <FormInput
                            id="username"
                            name="username"
                            type="text"
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            autoComplete="username"
                        />
                        <FormInput
                            id="password"
                            name="password"
                            type="password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <ErrorAlert message={error} />

                    <div>
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </Button>
                    </div>
                </form>
            </Suspense>
        </CenteredCard>
    );
}
