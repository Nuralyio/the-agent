import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #1a1a1a;
            color: #ffffff;
            overflow: hidden;
          }
          
          input:focus,
          textarea:focus,
          select:focus,
          button:focus {
            outline: 2px solid #ff6b35;
            outline-offset: 2px;
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #2d2d2d;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #505050;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #606060;
          }
        `}</style>
      </head>
      <body>
        <div id="root">
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
