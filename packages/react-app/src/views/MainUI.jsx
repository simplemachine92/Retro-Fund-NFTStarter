import React, { useState, useEffect } from "react";
import { Button } from "antd";
import { ethers } from "ethers";
import axios from "axios";

import { formatEther } from "@ethersproject/units";
import { usePoller } from "eth-hooks";

const MainUI = ({ loadWeb3Modal, address, tx, priceToMint, readContracts, writeContracts }) => {
  const [collection, setCollection] = useState({
    loading: true,
    items: [],
  });
  const [floor, setFloor] = useState("0.0");
  const [supply, setSupply] = useState();
  const [limit, setLimit] = useState();

  usePoller(async () => {
    if (readContracts && address) {
      const floorPrice = await readContracts.ExampleNFT2.floor();
      const supply = await readContracts.ExampleNFT2.currentToken();
      const limit = await readContracts.ExampleNFT2.limit();
      setSupply(formatEther(supply));
      setLimit(formatEther(limit));
      setFloor(formatEther(floorPrice));
    }
  }, 1500);

  const getTokenURI = async (ownerAddress, index) => {
    const id = await readContracts.ExampleNFT2.tokenOfOwnerByIndex(ownerAddress, index);
    const tokenURI = await readContracts.ExampleNFT2.tokenURI(id);
    const metadata = await axios.get(tokenURI);
    const approved = await readContracts.ExampleNFT2.getApproved(id);
    return { ...metadata.data, id, tokenURI, approved: approved === writeContracts.ExampleNFT2.address };
  };

  const loadCollection = async () => {
    if (!address || !readContracts || !writeContracts) return;
    setCollection({
      loading: true,
      items: [],
    });
    const balance = (await readContracts.ExampleNFT2.balanceOf(address)).toNumber();
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
      const redeemTx = await tx(writeContracts.ExampleNFT2.redeem(id));
      await redeemTx.wait();
    } catch (e) {
      console.log("redeem tx error:", e);
    }
    loadCollection();
  };

  const approveForBurn = async id => {
    try {
      const approveTx = await tx(writeContracts.ExampleNFT2.approve(writeContracts.ExampleNFT2.address, id));
      await approveTx.wait();
    } catch (e) {
      console.log("Approve tx error:", e);
    }
    loadCollection();
  };

  useEffect(() => {
    if (readContracts.ExampleNFT2) loadCollection();
  }, [address, readContracts, writeContracts]);

  return (
    <div style={{ maxWidth: 8000, margin: "20px auto" }}>
      {address ? (
        <>
          <div style={{ display: "grid", margin: "0 auto" }}>
            <h3 style={{ marginBottom: 1 }}>My collection: </h3>
            <div style={{ display: "grid", border: "1px solid #cccccc", padding: 16, width: 1000, margin: "auto", marginTop: 10, display:"flex", flexDirection:"row", flexWrap: "wrap" }}>
            {collection.items.length === 0 && <p></p>}
            {collection.items.length > 0 &&
              collection.items.map(item => (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  <img
                    style={{ maxWidth: "150px", display: "block", margin: "0 auto", marginBottom: "20px" }}
                    src={item.image}
                    alt="ExampleNFT2"
                  />
                  <div style={{ marginLeft: "20px" }}>
                      <Button style={{ width: "100%", minWidth: 100 }} onClick={() => redeem(item.id)}>
                        Redeem
                      </Button>
                  </div>
                </div>
              ))}
          </div>
          </div>
          <p style={{ textAlign: "center", marginTop: 1, }}>Current floor price = {floor.substr(0, 6)} ETH</p>
          <Button
            style={{ marginTop: 15, marginBottom: 15 }}
            type="primary"
            disabled={supply >= limit}
            onClick={async () => {
              const priceRightNow = await readContracts.ExampleNFT2.price();
              try {
                const txCur = await tx(writeContracts.ExampleNFT2.mintItem(address, { value: priceRightNow }));
                await txCur.wait();
              } catch (e) {
                console.log("mint failed", e);
              }
              loadCollection();
            }}
          > 
            MINT for ??{priceToMint && (+ethers.utils.formatEther(priceToMint)).toFixed(4)}
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

export default MainUI;
