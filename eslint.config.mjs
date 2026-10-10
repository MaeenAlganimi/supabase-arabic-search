import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  { ignores: ["coverage/**", "supabase/**"] },
  ...nextCoreWebVitals,
];

export default eslintConfig;
