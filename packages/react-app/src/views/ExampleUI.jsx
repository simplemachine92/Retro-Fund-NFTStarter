import { SyncOutlined } from "@ant-design/icons";
import { utils } from "ethers";
import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, List } from "antd";
import React, { useState, useEffect } from "react";
import { Address, Balance, Events } from "../components";
import { useHistory } from "react-router";
import { NFTStorage } from "nft.storage";
import { useDropzone } from "react-dropzone";
import { Link } from "react-router-dom";

export default function ExampleUI({
  purpose,
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
  deployments
}) {
  const [newPurpose, setNewPurpose] = useState("loading...");
  const [files, setFiles] = useState([]);
  //const history = useHistory();

  const client = new NFTStorage({
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDllRjc3OGNjQ0VCOEQ2NTg2ZDllRjYxYTEwNTk1Y0QyNDUwMGU5YUQiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzNTQ4MDM3MDAxMywibmFtZSI6ImRkIn0.Cy-vLvDjMBUGw8vuXTcM7Lv0Lj07aPx_S_LpHwRnV6c",
    endpoint: 'https://api.nft.storage',
  });
  
  function Previews() {
    
    
    const { getRootProps, getInputProps } = useDropzone({
      accept: ".json",
      maxFiles: 1000,
      onDrop: acceptedFiles => {
  
        setFiles(
          acceptedFiles.map(file =>
            Object.assign(file, {
              preview: URL.createObjectURL(file),
              pinblob: pintoStorage(acceptedFiles),
              //filelist: createList(...acceptedFiles)
            }),
          ),
        );
      },
    });
  
    useEffect(
      () => () => {
        // Make sure to revoke the data uris to avoid memory leaks
        files.forEach(file => URL.revokeObjectURL(file.preview));
      },
      [files],
    );
  
    return (
      <section className="container">
        <div {...getRootProps({ className: "dropzone" })}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop or click to upload .jsons</p>
        </div>
      </section>
    );
  }
  
  <Previews />;
  
  async function pintoStorage(file) {
      
      var cid = await client.storeDirectory(file)
       console.log(cid)
   
       //let filenames = file.path
       //filenames.map(file => file.path)
       //console.log(filenames)
   
     return cid;
   }
  
  

  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>

      <Button
            //disabled={!tokenAddress || !amountRequired || allowance.toString() == "0"}
            onClick={() => {
                  tx(
                    writeContracts.NFTDeployer.deploy(
                      "f",
                      ["f"],
                      "f",
                      "ff",
                      "9",
                    ),
                  )
                    .then(result => {
                      console.log(result);
                      result.wait().then(receipt => {
                        console.log(receipt);
                        history.push(`/view/${receipt.events[0].args._address}`);
                      })
                    .catch(err => {
                      //handle error here
                      console.log(err);
                    });
                })
                .catch(err => {
                  //handle error here
                  console.log(err);
                });
            }}
          >
            Deploy NFT
          </Button>

      <Previews files={files} setFiles={setFiles} />
              <div>
        Files :
        
        {
          files.map(file => <div>{file.path}   </div>)
        }
        </div>
        <List
          bordered
          dataSource={deployments}
          renderItem={item => (
            <List.Item>
              <div
                style={{
                  width: "100%",
                  position: "relative",
                  display: "flex",
                  flex: 1,
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Address
                  value={item._address}
                  ensProvider={mainnetProvider}
                  fontSize={18}
                  style={{ display: "flex", flex: 1, alignItems: "center" }}
                />
                <Link to={`/view/${item._address}`}>View NFT</Link>
              </div>
            </List.Item>
          )}
        />
        <h2>Example UI:</h2>
        <h4>purpose: {purpose}</h4>
        <Divider />
        <div style={{ margin: 8 }}>
          <Input
            onChange={e => {
              setNewPurpose(e.target.value);
            }}
          />
          <Button
            style={{ marginTop: 8 }}
            onClick={async () => {
              /* look how you call setPurpose on your contract: */
              /* notice how you pass a call back for tx updates too */
              const result = tx(writeContracts.ExampleNFT2.setPurpose(newPurpose), update => {
                console.log("📡 Transaction Update:", update);
                if (update && (update.status === "confirmed" || update.status === 1)) {
                  console.log(" 🍾 Transaction " + update.hash + " finished!");
                  console.log(
                    " ⛽️ " +
                      update.gasUsed +
                      "/" +
                      (update.gasLimit || update.gas) +
                      " @ " +
                      parseFloat(update.gasPrice) / 1000000000 +
                      " gwei",
                  );
                }
              });
              console.log("awaiting metamask/web3 confirm result...", result);
              console.log(await result);
            }}
          >
            Set Purpose!
          </Button>
        </div>
        <Divider />
        Your Address:
        <Address address={address} ensProvider={mainnetProvider} fontSize={16} />
        <Divider />
        ENS Address Example:
        <Address
          address="0x34aA3F359A9D614239015126635CE7732c18fDF3" /* this will show as austingriffith.eth */
          ensProvider={mainnetProvider}
          fontSize={16}
        />
        <Divider />
        {/* use utils.formatEther to display a BigNumber: */}
        <h2>Your Balance: {yourLocalBalance ? utils.formatEther(yourLocalBalance) : "..."}</h2>
        <div>OR</div>
        <Balance address={address} provider={localProvider} price={price} />
        <Divider />
        <div>🐳 Example Whale Balance:</div>
        <Balance balance={utils.parseEther("1000")} provider={localProvider} price={price} />
        <Divider />
        {/* use utils.formatEther to display a BigNumber: */}
        <h2>Your Balance: {yourLocalBalance ? utils.formatEther(yourLocalBalance) : "..."}</h2>
        <Divider />
        Your Contract Address:
        <Address
          address={readContracts && readContracts.ExampleNFT2 ? readContracts.ExampleNFT2.address : null}
          ensProvider={mainnetProvider}
          fontSize={16}
        />
        <Divider />
        <div style={{ margin: 8 }}>
          <Button
            onClick={() => {
              /* look how you call setPurpose on your contract: */
              tx(writeContracts.ExampleNFT2.setPurpose("🍻 Cheers"));
            }}
          >
            Set Purpose to &quot;🍻 Cheers&quot;
          </Button>
        </div>
        <div style={{ margin: 8 }}>
          <Button
            onClick={() => {
              /*
              you can also just craft a transaction and send it to the tx() transactor
              here we are sending value straight to the contract's address:
            */
              tx({
                to: writeContracts.ExampleNFT2.address,
                value: utils.parseEther("0.001"),
              });
              /* this should throw an error about "no fallback nor receive function" until you add it */
            }}
          >
            Send Value
          </Button>
        </div>
        <div style={{ margin: 8 }}>
          <Button
            onClick={() => {
              /* look how we call setPurpose AND send some value along */
              tx(
                writeContracts.ExampleNFT2.setPurpose("💵 Paying for this one!", {
                  value: utils.parseEther("0.001"),
                }),
              );
              /* this will fail until you make the setPurpose function payable */
            }}
          >
            Set Purpose With Value
          </Button>
        </div>
        <div style={{ margin: 8 }}>
          <Button
            onClick={() => {
              /* you can also just craft a transaction and send it to the tx() transactor */
              tx({
                to: writeContracts.ExampleNFT2.address,
                value: utils.parseEther("0.001"),
                data: writeContracts.ExampleNFT2.interface.encodeFunctionData("setPurpose(string)", [
                  "🤓 Whoa so 1337!",
                ]),
              });
              /* this should throw an error about "no fallback nor receive function" until you add it */
            }}
          >
            Another Example
          </Button>
        </div>
      </div>

      {/*
        📑 Maybe display a list of events?
          (uncomment the event and emit line in ExampleNFT2.sol! )
      */}
      <Events
        contracts={readContracts}
        contractName="NFTDeployer"
        eventName="Deployed"
        localProvider={localProvider}
        mainnetProvider={mainnetProvider}
        startBlock={1}
      />

<div style={{ marginTop: 30 }}>
        <List
          bordered
          dataSource={deployments}
          renderItem={item => (
            <List.Item>
              <div
                style={{
                  width: "100%",
                  position: "relative",
                  display: "flex",
                  flex: 1,
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Address
                  value={item.user}
                  ensProvider={mainnetProvider}
                  fontSize={18}
                  style={{ display: "flex", flex: 1, alignItems: "center" }}
                />
                <Link to={`/view/${item.user}`}>View Stream</Link>
              </div>
            </List.Item>
          )}
        />
      </div>

      <div style={{ width: 600, margin: "auto", marginTop: 32, paddingBottom: 256 }}>
        <Card>
          Check out all the{" "}
          <a
            href="https://github.com/austintgriffith/scaffold-eth/tree/master/packages/react-app/src/components"
            target="_blank"
            rel="noopener noreferrer"
          >
            📦 components
          </a>
        </Card>

        <Card style={{ marginTop: 32 }}>
          <div>
            There are tons of generic components included from{" "}
            <a href="https://ant.design/components/overview/" target="_blank" rel="noopener noreferrer">
              🐜 ant.design
            </a>{" "}
            too!
          </div>

          <div style={{ marginTop: 8 }}>
            <Button type="primary">Buttons</Button>
          </div>

          <div style={{ marginTop: 8 }}>
            <SyncOutlined spin /> Icons
          </div>

          <div style={{ marginTop: 8 }}>
            Date Pickers?
            <div style={{ marginTop: 2 }}>
              <DatePicker onChange={() => {}} />
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <Slider range defaultValue={[20, 50]} onChange={() => {}} />
          </div>

          <div style={{ marginTop: 32 }}>
            <Switch defaultChecked onChange={() => {}} />
          </div>

          <div style={{ marginTop: 32 }}>
            <Progress percent={50} status="active" />
          </div>

          <div style={{ marginTop: 32 }}>
            <Spin />
          </div>
        </Card>
      </div>
    </div>
  );
}
