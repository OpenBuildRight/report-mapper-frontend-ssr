"use client";

import { authClient } from "@/components/SessionProvider";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import FormInput from "@/components/FormInput";
import ErrorAlert from "@/components/ErrorAlert";
import Card from "@/components/Card";
import Link from "next/link";

function SignInForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const callbackURL = searchParams.get("callbackURL") || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const { data, error } = await authClient.signIn.username({
            username,
            password,
        });

        if (error) {
            setError(error.message || "Failed to sign in. Please check your credentials.");
            setIsLoading(false);
            return;
        }

        // Sign in successful, now redirect manually
        if (data) {
            window.location.href = callbackURL;
        } else {
            setIsLoading(false);
        }
    };

    return (
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

                    <div className="space-y-4">
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </Button>

                        <div className="text-center">
                            <Link
                                href="/sign-up"
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Don't have an account? Sign up
                            </Link>
                        </div>
                    </div>
                </form>
    );
}

export default function SignInPage() {
    return (
        <Card title="Sign in to your account">
            <Suspense>
                <SignInForm />
            </Suspense>
        </Card>
    );
}
