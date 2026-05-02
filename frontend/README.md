# PrepForge Frontend

Run the following command to initialise the Next.js app (one-time setup):

```bash
cd ..   # go to prepforge root
pnpm create next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

Then install additional dependencies:
```bash
cd frontend
pnpm add @clerk/nextjs
pnpm add @tanstack/react-query @tanstack/react-query-devtools
pnpm add zustand
pnpm add axios
pnpm dlx shadcn-ui@latest init
```

Copy `.env.local.example` to `.env.local` and fill in your Clerk keys.
