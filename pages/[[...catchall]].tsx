/* eslint-disable */
  import * as React from "react";
import {
  PlasmicComponent,
  extractPlasmicQueryData,
  ComponentRenderData,
  PlasmicRootProvider,
} from "@plasmicapp/loader-nextjs";
import type { GetStaticPaths, GetStaticProps } from "next";

import Error from "next/error";
import { useRouter } from "next/router";
import { PLASMIC, host, projectId, projectApiToken } from "@/plasmic-init"

export default function PlasmicLoaderPage(props: {
  plasmicData?: ComponentRenderData;
  queryCache?: Record<string, any>;
}) {
  const { plasmicData, queryCache } = props;
  const router = useRouter();
  if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
    return <Error statusCode={404} />;
  }
  const pageMeta = plasmicData.entryCompMetas[0];
  return (
    <PlasmicRootProvider
      loader={PLASMIC}
      prefetchedData={plasmicData}
      prefetchedQueryData={queryCache}
      pageRoute={pageMeta.path}
      pageParams={pageMeta.params}
      pageQuery={router.query}
    >
      <PlasmicComponent component={pageMeta.displayName} />
    </PlasmicRootProvider>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { catchall } = context.params ?? {};
  const plasmicPath = typeof catchall === 'string' ? catchall : Array.isArray(catchall) ? `/${catchall.join('/')}` : '/';
  const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);
  if (!plasmicData) {
    // non-Plasmic catch-all
    return { props: {} };
  }
  const pageMeta = plasmicData.entryCompMetas[0];
  // Cache the necessary data fetched for the page
  const queryCache = await extractPlasmicQueryData(
    <PlasmicRootProvider
      loader={PLASMIC}
      prefetchedData={plasmicData}
      pageRoute={pageMeta.path}
      pageParams={pageMeta.params}
    >
      <PlasmicComponent component={pageMeta.displayName} />
    </PlasmicRootProvider>
  );
  // Use revalidate if you want incremental static regeneration
  return { props: { plasmicData, queryCache }};
}

const isAgency = (baseUrl: string): boolean => {
  const url = new URL(baseUrl);
  const params = url.searchParams;

  if (!isCockpit(baseUrl) && !isMLS(baseUrl)) {
    return false;
  }

  return (
    /estates$/.test(baseUrl) || 
    /* /builder\/projects$/.test(baseUrl) || At the moment the MLS does not require Agency page built with builder-app */
    /estates/.test(url.pathname) && params.has('uuids') ||
    /builder\/projects/.test(url.pathname) // && params.has('ids')
  )
};
  
const isCockpit = (baseUrl: string): boolean => {
  const url = new URL(baseUrl);
  return (
    url.hostname === 'newcockpit.yurekai.com'
  );
}

const isMLS = (baseUrl: string): boolean => new URL(baseUrl).hostname === 'mls.yurekai.com';

const getDataSources = async () => {
  const response = await (await fetch(
    host + '/api/v1/data-source/projects/sources', 
    { 
      headers: { 
        'x-plasmic-api-project-tokens':  projectId + ':' + projectApiToken
      }
    }
  )).json();
  return response.data[0]?.[projectId];
};

export const getStaticPaths: GetStaticPaths = async () => {
  const pageModules = await PLASMIC.fetchPages();
  const items = [];
  try {
    const dataSources = await getDataSources()

    for (const dataSource of dataSources) {
      const { 
        settings: { 
          baseUrl,
          commonHeaders: headers = {},
        },
      } = dataSource;
        
      if (isAgency(baseUrl)) {
        console.log('GET', baseUrl);
        const response = await (await fetch(
            baseUrl, 
            {
              headers: { ...headers }  
            }
          )).json()
          if (isCockpit(baseUrl)) {
            items.push(...response.data.map(({ uuid }: any) => uuid));
          } else if (isMLS(baseUrl)) {
            items.push(...response?.items.map(({ idProject }: any) => idProject))
          }
      }
    }

    /*
        const results = await Promise.all(
          response
            .filter(({settings: { baseUrl } }: any) => {
              return isAgency(baseUrl);
            })
            .map( async ({ settings: { baseUrl, commonHeaders: headers = {} } }: any) => {
              console.log('GET', baseUrl);
              const response = await (await fetch(
                baseUrl, 
                {
                  headers: { ...headers }  
                }
              )).json()
    
              if (isCockpit(baseUrl)) {
                return response.data.map(({ uuid }: any) => uuid) || [];
              } else if (isMLS(baseUrl)) {
                return response?.items.map(({ idProject }: any) => idProject) || [];
              } else {
                return [];
              }
            }),
        );
    
        items.push(
          ...result
        );
    */
    console.log("ITEMS");

    console.log(items);

  } catch (ex) {
    console.error(ex);
  }

  return {
    paths: [
      ...pageModules.map((mod) => ({
        params: {
          catchall: mod.path.substring(1).split("/"),
        },
      })),
      ...items.map((item) => ({
        params: {
          catchall: [ 'estates', item.toString() ]
        },
      })),
    ],
    fallback: "blocking",
  };
}
