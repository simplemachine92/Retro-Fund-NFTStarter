import React, { useState, useEffect } from "react";
import { Button } from "antd";
import { ethers } from "ethers";
import axios from "axios";

import { formatEther } from "@ethersproject/units";
import { usePoller } from "eth-hooks";
import { NFTABI } from "../contracts/NFTABI";

import { useContractReader, useContractLoader  } from "eth-hooks";
import { useContractConfig } from "../hooks";
import { useParams } from "react-router-dom";

const ViewNFT = ({ loadWeb3Modal, tx, localProvider, userSigner, localChainId, address}) => {
  const [collection, setCollection] = useState({
    loading: true,
    items: [],
  });
  const [floor, setFloor] = useState("0.0");
  const [supply, setSupply] = useState();
  const [limit, setLimit] = useState();

  const { nft } = useParams();

  let contractConfig = useContractConfig({ customAddresses: { ExampleNFT2: nft } });
  //const newNFT = useExternalContractLoader(provider, address, NFTABI);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  const priceToMint = useContractReader(readContracts, contractConfig, "price");

  usePoller(async () => {
    if (readContracts && address) {
      const floorPrice = await readContracts.newNFT.floor();
      const supply = await readContracts.newNFT.currentToken();
      const limit = await readContracts.newNFT.limit();
      setSupply(formatEther(supply));
      setLimit(formatEther(limit));
      setFloor(formatEther(floorPrice));
    }
  }, 1500);

  const getTokenURI = async (ownerAddress, index) => {
    const id = await readContracts.newNFT.tokenOfOwnerByIndex(ownerAddress, index);
    const tokenURI = await readContracts.newNFT.tokenURI(id);
    const metadata = await axios.get(tokenURI);
    const approved = await readContracts.newNFT.getApproved(id);
    return { ...metadata.data, id, tokenURI, approved: approved === writeContracts.newNFT.address };
  };

  const loadCollection = async () => {
    if (!address || !readContracts || !writeContracts) return;
    setCollection({
      loading: true,
      items: [],
    });
    const balance = (await readContracts.newNFT.balanceOf(address)).toNumber();
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
      const redeemTx = await tx(writeContracts.newNFT.redeem(id));
      await redeemTx.wait();
    } catch (e) {
      console.log("redeem tx error:", e);
    }
    loadCollection();
  };

  const approveForBurn = async id => {
    try {
      const approveTx = await tx(writeContracts.newNFT.approve(writeContracts.newNFT.address, id));
      await approveTx.wait();
    } catch (e) {
      console.log("Approve tx error:", e);
    }
    loadCollection();
  };

  useEffect(() => {
    if (readContracts.newNFT) loadCollection();
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
                <div style={{ border: "1px solid #cccccc", padding: 16, width: 1000, margin: "auto", marginTop: 20, display:"flex", flexDirection:"row" }}>
                  <img
                    style={{ maxWidth: "150px", display: "block", margin: "0 auto", marginBottom: "20px" }}
                    src={item.image}
                    alt="Your NFT"
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
            disabled={supply >= limit}
            onClick={async () => {
              const priceRightNow = await readContracts.newNFT.price();
              try {
                const txCur = await tx(writeContracts.newNFT.mintItem(address, { value: priceRightNow }));
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

export default ViewNFT;
