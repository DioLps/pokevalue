import type { SVGProps } from 'react';

export function PokeballIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <circle cx="12" cy="12" r="3.5" fill="hsl(var(--primary-foreground))" stroke="hsl(var(--background))" strokeWidth="2"></circle>
       <circle cx="12" cy="12" r="1.5" fill="hsl(var(--primary))"></circle>
    </svg>
  );
}
