"use client";

import { authClient } from "@/components/SessionProvider";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import FormInput from "@/components/FormInput";
import ErrorAlert from "@/components/ErrorAlert";
import Card from "@/components/Card";
import Link from "next/link";
import { validateUsername, validatePassword, validateName, validateEmail } from "@/lib/validation";

function SignUpForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const callbackURL = searchParams.get("callbackURL") || "/";

    // Field-specific errors
    const [usernameError, setUsernameError] = useState("");
    const [nameError, setNameError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    // Validation status for each field
    type ValidationStatus = 'neutral' | 'validating' | 'valid' | 'invalid';
    const [usernameStatus, setUsernameStatus] = useState<ValidationStatus>('neutral');
    const [nameStatus, setNameStatus] = useState<ValidationStatus>('neutral');
    const [passwordStatus, setPasswordStatus] = useState<ValidationStatus>('neutral');

    // Track if fields are valid for form submission
    const [validationState, setValidationState] = useState({
        username: false,
        name: false,
        password: false,
        email: true, // Email is optional, so starts as valid
    });

    // Validation functions - use shared validation logic
    const handleUsernameChange = (value: string) => {
        setUsername(value);

        // Set to neutral when user modifies the field
        setUsernameStatus('neutral');

        // Fast synchronous validation on every keystroke
        const error = validateUsername(value);
        setUsernameError(error || "");

        if (error === null) {
            // Valid format, but not yet checked for availability
            setUsernameStatus('valid');
            setValidationState(prev => ({ ...prev, username: true }));
        } else {
            setUsernameStatus('invalid');
            setValidationState(prev => ({ ...prev, username: false }));
        }
    };

    const handleNameChange = (value: string) => {
        setName(value);

        // Set to neutral when user modifies the field
        setNameStatus('neutral');

        // Fast synchronous validation on every keystroke
        const error = validateName(value);
        setNameError(error || "");

        if (error === null) {
            setNameStatus('valid');
            setValidationState(prev => ({ ...prev, name: true }));
        } else {
            setNameStatus('invalid');
            setValidationState(prev => ({ ...prev, name: false }));
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);

        // Set to neutral when user modifies the field
        setPasswordStatus('neutral');

        // Fast synchronous validation on every keystroke
        const error = validatePassword(value);
        setPasswordError(error || "");

        if (error === null) {
            setPasswordStatus('valid');
            setValidationState(prev => ({ ...prev, password: true }));
        } else {
            setPasswordStatus('invalid');
            setValidationState(prev => ({ ...prev, password: false }));
        }
    };

    // Async username availability check - only on blur
    const checkUsernameAvailability = async () => {
        // Only check if basic validation passes
        if (usernameError || usernameStatus === 'invalid') {
            return;
        }

        setUsernameStatus('validating');

        try {
            const { data: response, error } = await authClient.isUsernameAvailable({
                username
            });

            if (error || !response?.available) {
                setUsernameError("Username is already taken");
                setUsernameStatus('invalid');
                setValidationState(prev => ({ ...prev, username: false }));
            } else {
                setUsernameStatus('valid');
                setValidationState(prev => ({ ...prev, username: true }));
            }
        } catch (err) {
            setUsernameError("Error checking username availability");
            setUsernameStatus('invalid');
            setValidationState(prev => ({ ...prev, username: false }));
        }
    };

    // Check if form is valid for submission
    const isFormValid = Object.values(validationState).every(v => v);

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
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            onBlur={checkUsernameAvailability}
                            placeholder="Choose a username"
                            required
                            autoComplete="username"
                            error={usernameError}
                            validationStatus={usernameStatus}
                        />
                        <FormInput
                            id="name"
                            name="name"
                            type="text"
                            label="Display Name"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Your name"
                            required
                            autoComplete="name"
                            error={nameError}
                            validationStatus={nameStatus}
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
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            placeholder="Choose a password (min 8 characters)"
                            required
                            autoComplete="new-password"
                            error={passwordError}
                            validationStatus={passwordStatus}
                        />
                    </div>

                    <ErrorAlert message={error} />

                    <div className="space-y-4">
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={!isFormValid || isLoading || usernameStatus === 'validating'}
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
        <Card title="Create your account">
            <Suspense>
                <SignUpForm />
            </Suspense>
        </Card>
    );
}
