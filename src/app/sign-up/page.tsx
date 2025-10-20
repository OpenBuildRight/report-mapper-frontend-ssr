"use client";

import { authClient } from "@/components/SessionProvider";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import FormInput from "@/components/FormInput";
import ErrorAlert from "@/components/ErrorAlert";
import CenteredCard from "@/components/CenteredCard";
import Link from "next/link";

function SignUpForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const callbackURL = searchParams.get("callbackURL") || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        // Better-auth requires email, so generate a dummy one if not provided
        // Dummy emails (ending with @local.username) skip email verification
        const finalEmail = email || `${username}@local.username`;

        const { data, error } = await authClient.signUp.email({
            username,
            password,
            name,
            email: finalEmail,
        });

        if (error) {
            setError(error.message || "Failed to sign up. Please try again.");
            setIsLoading(false);
            return;
        }

        // Sign up successful, now redirect manually
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
                            placeholder="Choose a username"
                            required
                            autoComplete="username"
                        />
                        <FormInput
                            id="name"
                            name="name"
                            type="text"
                            label="Display Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            required
                            autoComplete="name"
                        />
                        <FormInput
                            id="email"
                            name="email"
                            type="email"
                            label="Email (optional)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            autoComplete="email"
                        />
                        <FormInput
                            id="password"
                            name="password"
                            type="password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Choose a password (min 8 characters)"
                            required
                            autoComplete="new-password"
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
                            {isLoading ? "Creating account..." : "Sign up"}
                        </Button>

                        <div className="text-center">
                            <Link
                                href="/sign-in"
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Already have an account? Sign in
                            </Link>
                        </div>
                    </div>
                </form>
    );
}

export default function SignUpPage() {
    return (
        <CenteredCard title="Create your account">
            <Suspense>
                <SignUpForm />
            </Suspense>
        </CenteredCard>
    );
}
