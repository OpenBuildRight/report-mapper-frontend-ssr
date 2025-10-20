"use client";

import {authClient} from "@/components/SessionProvider";
import {Suspense, useState} from "react";
import {useSearchParams} from "next/navigation";
import Button from "@/components/Button";

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
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-xl">
                <div>
                    <h2 className="text-center text-3xl font-bold text-gray-100">
                        Sign in to your account
                    </h2>
                </div>
                <Suspense>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your username"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-900 bg-opacity-50 p-4">
                                <p className="text-sm text-red-200">{error}</p>
                            </div>
                        )}

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
            </div>
        </div>
    );
}
