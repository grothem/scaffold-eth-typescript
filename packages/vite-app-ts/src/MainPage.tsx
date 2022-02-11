import React, { FC, useEffect, useState } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import '~~/styles/main-page.css';

import { GenericContract } from 'eth-components/ant/generic-contract';
import { useContractReader, useBalance, useEthersAdaptorFromProviderOrSigners, useEventListener } from 'eth-hooks';
import { useEthersContext } from 'eth-hooks/context';
import { useDexEthPrice } from 'eth-hooks/dapps';
import { asEthersAdaptor } from 'eth-hooks/functions';

import { MainPageMenu, MainPageFooter, MainPageHeader } from './components/main';
import { useScaffoldHooksExamples as useScaffoldHooksExamples } from './components/main/hooks/useScaffoldHooksExamples';

import { useBurnerFallback } from '~~/components/main/hooks/useBurnerFallback';
import { useScaffoldProviders as useScaffoldAppProviders } from '~~/components/main/hooks/useScaffoldAppProviders';
import { Hints, ExampleUI } from '~~/components/pages';
import { BURNER_FALLBACK_ENABLED, MAINNET_PROVIDER } from '~~/config/appConfig';
import { useAppContracts, useConnectAppContracts, useLoadAppContracts } from '~~/config/contractContext';
import { NETWORKS } from '~~/models/constants/networks';

import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import { AddressInput } from 'eth-components/ant';

const web3 = createAlchemyWeb3('YOUR_ALCHEMY_APP_URL');
const ensContractAddress = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85'; // mainnet
interface Metadata {
  title: string;
  description: string;
  image: string;
}

/**
 * ⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️
 * See config/appConfig.ts for configuration, such as TARGET_NETWORK
 * See MainPageContracts.tsx for your contracts component
 * See contractsConnectorConfig.ts for how to configure your contracts
 * ⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️
 *
 * For more
 */

/**
 * The main component
 * @returns
 */
export const Main: FC = () => {
  // -----------------------------
  // Providers, signers & wallets
  // -----------------------------
  // 🛰 providers
  // see useLoadProviders.ts for everything to do with loading the right providers
  const scaffoldAppProviders = useScaffoldAppProviders();

  // 🦊 Get your web3 ethers context from current providers
  const ethersContext = useEthersContext();

  // if no user is found use a burner wallet on localhost as fallback if enabled
  useBurnerFallback(scaffoldAppProviders, BURNER_FALLBACK_ENABLED);

  const [address, setAddress] = useState('');
  const [nfts, setNfts] = useState<Metadata[]>([]);
  useEffect(() => {
    if (!address) {
      setNfts([]);
      return;
    }

    const getNfts = async (): Promise<void> => {
      const nfts = await web3.alchemy.getNfts({
        owner: address,
      });

      const nftMetadata: Metadata[] = [];
      for (let i = 0; i < nfts.ownedNfts.length; i++) {
        const nft = nfts.ownedNfts[i];
        const metadata = await web3.alchemy.getNftMetadata({
          contractAddress: nft.contract.address,
          tokenId: nft.id.tokenId,
        });

        if (!metadata.metadata) {
          continue;
        }

        let image = metadata.metadata?.image ?? '';
        let title = metadata.title;
        if (!metadata.metadata.image && metadata.tokenUri) {
          const decoder = new TextDecoder();
          const content = metadata.tokenUri.raw.replace('data:application/json;base64,', '');
          try {
            const buffer = Buffer.from(content, 'base64');
            const json = JSON.parse(decoder.decode(buffer));
            console.log(json);
            image = json.image;
            title = json.name;
          } catch (error) {
            console.log(error);
          }
        } else if (nft.contract.address === ensContractAddress) {
          image = `https://metadata.ens.domains/mainnet/${ensContractAddress}/${nft.id.tokenId}/image`;
        }

        console.log(metadata);
        nftMetadata.push({
          title,
          description: metadata.description,
          image,
        });
      }
      setNfts(nftMetadata);
    };
    getNfts().then(
      () => {},
      () => {}
    );
  }, [address]);

  // -----------------------------
  // Load Contracts
  // -----------------------------
  // 🛻 load contracts
  useLoadAppContracts();
  // 🏭 connect to contracts for mainnet network & signer
  const [mainnetAdaptor] = useEthersAdaptorFromProviderOrSigners(MAINNET_PROVIDER);
  useConnectAppContracts(mainnetAdaptor);
  // 🏭 connec to  contracts for current network & signer
  useConnectAppContracts(asEthersAdaptor(ethersContext));

  // -----------------------------
  // Hooks use and examples
  // -----------------------------
  // 🎉 Console logs & More hook examples:
  // 🚦 disable this hook to stop console logs
  // 🏹🏹🏹 go here to see how to use hooks!
  useScaffoldHooksExamples(scaffoldAppProviders);

  // -----------------------------
  // These are the contracts!
  // -----------------------------

  // init contracts
  const yourContract = useAppContracts('YourContract', ethersContext.chainId);
  const mainnetDai = useAppContracts('DAI', NETWORKS.mainnet.chainId);

  // keep track of a variable from the contract in the local React state:
  const [purpose, update] = useContractReader(
    yourContract,
    yourContract?.purpose,
    [],
    yourContract?.filters.SetPurpose()
  );

  // 📟 Listen for broadcast events
  const [setPurposeEvents] = useEventListener(yourContract, 'SetPurpose', 0);

  // -----------------------------
  // .... 🎇 End of examples
  // -----------------------------
  // 💵 This hook will get the price of ETH from 🦄 Uniswap:
  const [ethPrice] = useDexEthPrice(scaffoldAppProviders.mainnetAdaptor?.provider, scaffoldAppProviders.targetNetwork);

  // 💰 this hook will get your balance
  const [yourCurrentBalance] = useBalance(ethersContext.account);

  const [route, setRoute] = useState<string>('');
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  return (
    <div className="App">
      <MainPageHeader scaffoldAppProviders={scaffoldAppProviders} price={ethPrice} />

      {/* Routes should be added between the <Switch> </Switch> as seen below */}
      <BrowserRouter>
        <MainPageMenu route={route} setRoute={setRoute} />
        <Switch>
          <Route exact path="/">
            <div className="max-w-md mx-auto mt-10">
              <AddressInput
                hideScanner={true}
                ensProvider={scaffoldAppProviders.mainnetAdaptor?.provider}
                placeholder="Search Address"
                address={address}
                onChange={setAddress}
              />
            </div>
            <div className="flex flex-wrap">
              {nfts.map((nft, i) => (
                <div key={i}>
                  <img style={{ width: '250px', height: '250px' }} className="w-full" src={nft.image} />
                  <div>{nft.title}</div>
                  <div>{nft.description}</div>
                </div>
              ))}
            </div>
            {/* <MainPageContracts scaffoldAppProviders={scaffoldAppProviders} /> */}
          </Route>
          {/* you can add routes here like the below examlples */}
          <Route path="/hints">
            <Hints
              address={ethersContext?.account ?? ''}
              yourCurrentBalance={yourCurrentBalance}
              mainnetProvider={scaffoldAppProviders.mainnetAdaptor?.provider}
              price={ethPrice}
            />
          </Route>
          <Route path="/exampleui">
            <ExampleUI
              mainnetProvider={scaffoldAppProviders.mainnetAdaptor?.provider}
              yourCurrentBalance={yourCurrentBalance}
              price={ethPrice}
            />
          </Route>
          <Route path="/mainnetdai">
            {MAINNET_PROVIDER != null && (
              <GenericContract
                contractName="DAI"
                contract={mainnetDai}
                mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
                blockExplorer={NETWORKS.mainnet.blockExplorer}
              />
            )}
          </Route>
          {/* Subgraph also disabled in MainPageMenu, it does not work, see github issue! */}
          {/*
          <Route path="/subgraph">
            <Subgraph subgraphUri={subgraphUri} mainnetProvider={scaffoldAppProviders.mainnetAdaptor?.provider} />
          </Route>
          */}
        </Switch>
      </BrowserRouter>

      <MainPageFooter scaffoldAppProviders={scaffoldAppProviders} price={ethPrice} />
    </div>
  );
};
