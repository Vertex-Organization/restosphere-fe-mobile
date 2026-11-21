import { ScrollViewStyleReset, useServerDocumentContext } from "expo-router/html";
import type { PropsWithChildren } from "react";
import { colors } from "@/theme";

export default function RootHtml({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();
  return (
    <html {...htmlAttributes} lang="vi" data-type="software">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content={colors.background} />
        <meta
          name="description"
          content="Không gian làm việc RestoSphere dành cho nhân viên nhà hàng: lễ tân, phục vụ, thu ngân, bếp và quản trị."
        />
        <meta name="page-type" content="software" />
        <meta name="site-kind" content="software" />
        <title>RestoSphere · Không gian làm việc</title>
        <ScrollViewStyleReset />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
