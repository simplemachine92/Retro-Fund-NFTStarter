import React, { useState, useEffect, useParams } from "react";
import { Button } from "antd";
import { ethers } from "ethers";
import axios from "axios";
import { useEventListener } from "eth-hooks/events/useEventListener";

import { formatEther } from "@ethersproject/units";
import { usePoller } from "eth-hooks";

const Deployed = ({ loadWeb3Modal, address, tx, }) => {

  let { nft } = useParams();

  const [customAddresses, setCustomAddresses] = useState({});

  let contractConfig = useContractConfig({ customAddresses: { NFTDeployer: nft } });

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  const nftDeployerEvents = useEventListener(readContracts, "NFTDeployer", "Deployed", localProvider, 1);

  const nftAddress = nftDeployerEvents && nftDeployerEvents.find(el => el.args._address == nft);

  const newNFTContract = readContracts.nft.attach(nftAddress.args._token);

  const priceToMint = useContractReader(readContracts, "", "price");

  const [collection, setCollection] = useState({
    loading: true,
    items: [],
  });
  const [floor, setFloor] = useState("0.0");

  usePoller(async () => {
    if (readContracts && address) {
      const floorPrice = await readContracts.newNFTContract.floor();
      setFloor(formatEther(floorPrice));
    }
  }, 1500);

  const getTokenURI = async (ownerAddress, index) => {
    const id = await readContracts.newNFTContract.tokenOfOwnerByIndex(ownerAddress, index);
    const tokenURI = await readContracts.newNFTContract.tokenURI(id);
    const metadata = await axios.get(tokenURI);
    const approved = await readContracts.newNFTContract.getApproved(id);
    return { ...metadata.data, id, tokenURI, approved: approved === writeContracts.newNFTContract.address };
  };

  //const setPurposeEvents = useEventListener(readContracts, "NFTDeployer", "Deployed", localProvider, 1);

  const loadCollection = async () => {
    if (!address || !readContracts || !writeContracts) return;
    setCollection({
      loading: true,
      items: [],
    });
    const balance = (await readContracts.newNFTContract.balanceOf(address)).toNumber();
    const tokensPromises = [];
    for (let i = 0; i < balance; i += 1) {
      tokensPromises.push(getTokenURI(address, i));
    }
    const tokens = await Promise.all(tokensPromises);
    setCollection({
      loading: false,
      items: tokens,
    });
  };

  const redeem = async id => {
    try {
      const redeemTx = await tx(writeContracts.newNFTContract.redeem(id));
      await redeemTx.wait();
    } catch (e) {
      console.log("redeem tx error:", e);
    }
    loadCollection();
  };

  const approveForBurn = async id => {
    try {
      const approveTx = await tx(writeContracts.newNFTContract.approve(writeContracts.newNFTContract.address, id));
      await approveTx.wait();
    } catch (e) {
      console.log("Approve tx error:", e);
    }
    loadCollection();
  };

  useEffect(() => {
    let newCustomAddresses = { NFTDeployer: nft };
    setCustomAddresses(newCustomAddresses);
  }, [nftMetaData]);

  useEffect(() => {
    if (readContracts.newNFTContract) loadCollection();
  }, [address, readContracts, writeContracts]);

  return (
    <div style={{ maxWidth: 768, margin: "20px auto" }}>
      {address ? (
        <>
          <div style={{ display: "grid", margin: "0 auto" }}>
            <h3 style={{ marginBottom: 25 }}>My collection: </h3>
            {collection.items.length === 0 && <p>Your collection is empty</p>}
            {collection.items.length > 0 &&
              collection.items.map(item => (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  <img
                    style={{ maxWidth: "150px", display: "block", margin: "0 auto", marginBottom: "20px" }}
                    src={item.image}
                    alt="newNFTContract"
                  />
                  <div style={{ marginLeft: "20px" }}>
                      <Button style={{ width: "100%", minWidth: 100 }} onClick={() => redeem(item.id)}>
                        Redeem
                      </Button>
                  </div>
                </div>
              ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 15 }}>Current floor price = {floor.substr(0, 6)} ETH</p>
          <Button
            style={{ marginTop: 15 }}
            type="primary"
            onClick={async () => {
              const priceRightNow = await readContracts.newNFTContract.price();
              try {
                const txCur = await tx(writeContracts.newNFTContract.mintItem(address, { value: priceRightNow }));
                await txCur.wait();
              } catch (e) {
                console.log("mint failed", e);
              }
              loadCollection();
            }}
          >
            MINT for Ξ{priceToMint && (+ethers.utils.formatEther(priceToMint)).toFixed(4)}
          </Button>
        </>
      ) : (
        <Button key="loginbutton" type="primary" onClick={loadWeb3Modal}>
          Connect to mint
        </Button>
      )}
    </div>
  );
};

export default Deployed;
