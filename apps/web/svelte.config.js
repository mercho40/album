import adapter from "@sveltejs/adapter-vercel";

const config = {
	kit: {
		adapter: adapter({ runtime: "nodejs20.x" }),
		alias: {
			"@back/*": "../back/src/*",
		},
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes("node_modules") ? undefined : { runes: true },
	},
};

export default config;
