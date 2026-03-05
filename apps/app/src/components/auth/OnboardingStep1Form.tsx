"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkSlugAvailability, onboardingStep1Action } from "@/actions/auth";

function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.trim()
		.substring(0, 50);
}

export function OnboardingStep1Form({ userId }: { userId: string }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const [orgName, setOrgName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugStatus, setSlugStatus] = useState<
		"idle" | "checking" | "available" | "taken" | "reserved"
	>("idle");

	// Auto-generate slug from org name
	useEffect(() => {
		const generated = slugify(orgName);
		if (generated !== slug) {
			setSlug(generated);
		}
	}, [orgName]);

	// Check slug availability with debounce
	useEffect(() => {
		if (!slug || slug.length < 3) {
			setSlugStatus("idle");
			return;
		}

		setSlugStatus("checking");
		const timer = setTimeout(async () => {
			const result = await checkSlugAvailability(slug);
			if (!result.available) {
				setSlugStatus(result.reason ? "reserved" : "taken");
			} else {
				setSlugStatus("available");
			}
		}, 500);

		return () => clearTimeout(timer);
	}, [slug]);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);

		if (slugStatus === "taken" || slugStatus === "reserved") {
			setError("Ce slug n'est pas disponible.");
			return;
		}

		const formData = new FormData(e.currentTarget);
		formData.set("slug", slug);

		startTransition(async () => {
			const result = await onboardingStep1Action(userId, formData);

			if (result.error) {
				setError(result.error);
				return;
			}

			// Store orgId in session storage to pass between steps
			if (result.organizationId) {
				sessionStorage.setItem("onboarding_org_id", result.organizationId);
			}

			router.push("/onboarding/activity");
		});
	}

	const slugStatusIcon = {
		idle: null,
		checking: (
			<svg
				className="animate-spin w-4 h-4 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle
					className="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					strokeWidth="4"
				/>
				<path
					className="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
				/>
			</svg>
		),
		available: (
			<span className="text-green-500 text-xs font-medium">✓ Disponible</span>
		),
		taken: (
			<span className="text-red-500 text-xs font-medium">✗ Déjà pris</span>
		),
		reserved: (
			<span className="text-red-500 text-xs font-medium">✗ Réservé</span>
		),
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			{error && (
				<div
					className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
					role="alert"
				>
					{error}
				</div>
			)}

			<div className="space-y-1">
				<label
					htmlFor="organizationName"
					className="block text-sm font-medium text-gray-700"
				>
					Nom de l&apos;organisation{" "}
					<span className="text-red-500" aria-hidden="true">
						*
					</span>
				</label>
				<input
					id="organizationName"
					name="organizationName"
					type="text"
					required
					value={orgName}
					onChange={(e) => setOrgName(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
					placeholder="Mon Association Culturelle"
					maxLength={100}
				/>
			</div>

			<div className="space-y-1">
				<label
					htmlFor="slug"
					className="block text-sm font-medium text-gray-700"
				>
					Adresse Evoly
				</label>
				<div className="flex items-center">
					<span className="flex-shrink-0 px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-500">
						evoly.me/
					</span>
					<div className="relative flex-1">
						<input
							id="slug"
							name="slug"
							type="text"
							required
							value={slug}
							onChange={(e) => setSlug(slugify(e.target.value))}
							className="w-full px-3 py-2 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
							placeholder="mon-association"
							minLength={3}
							maxLength={50}
						/>
					</div>
				</div>
				<div className="flex justify-between items-center">
					<p className="text-xs text-gray-400">
						Uniquement des lettres minuscules, chiffres et tirets. Min. 3
						caractères.
					</p>
					<span className="text-xs">{slugStatusIcon[slugStatus]}</span>
				</div>
			</div>

			<button
				type="submit"
				disabled={
					isPending ||
					slugStatus === "taken" ||
					slugStatus === "reserved" ||
					slug.length < 3
				}
				className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
			>
				{isPending && (
					<svg
						className="animate-spin h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						/>
					</svg>
				)}
				Continuer
			</button>
		</form>
	);
}
