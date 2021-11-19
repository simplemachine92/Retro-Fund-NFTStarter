import React, { useState } from "react";

import { Button, Input } from "antd";
import { formatEther, parseEther } from "@ethersproject/units";
import { usePoller } from "eth-hooks";
import { NFTStorage, File, Blob } from "nft.storage";
const client = new NFTStorage({
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDllRjc3OGNjQ0VCOEQ2NTg2ZDllRjYxYTEwNTk1Y0QyNDUwMGU5YUQiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzNTQ4MDM3MDAxMywibmFtZSI6ImRkIn0.Cy-vLvDjMBUGw8vuXTcM7Lv0Lj07aPx_S_LpHwRnV6c",
  endpoint: 'https://api.nft.storage',
});

const thumbsContainer = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 16,
};

const thumb = {
  display: "inline-flex",
  borderRadius: 2,
  border: "1px solid #eaeaea",
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: "border-box",
};

const thumbInner = {
  display: "flex",
  minWidth: 0,
  overflow: "hidden",
};

const img = {
  display: "block",
  width: "auto",
  height: "100%",
};

function Previews({ files, setFiles }) {
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

const NewNFT = ({ readContracts, address, writeContracts, tx, userSigner }) => {
  const [q, setQ] = useState("");
  const [floor, setFloor] = useState("0.0");

  usePoller(async () => {
    if (readContracts && address) {
      const floorPrice = await readContracts.ExampleNFT2.floor();
      setFloor(formatEther(floorPrice));
    }
  }, 1500);

  const increaseFloor = async () => {
    tx(
      userSigner.sendTransaction({
        to: writeContracts.ExampleNFT2.address,
        value: parseEther(q),
      }),
    );
  };

  return (
    <div style={{ maxWidth: 300, margin: "20px auto" }}>
      <h2 style={{ marginBottom: "20px" }}>Increasing floor</h2>
      <div style={{ display: "flex", alignItems: "center", maxWidth: 300, margin: "0 auto", marginBottom: "10px" }}>
        <label htmlFor="quantity" style={{ marginRight: 20, flexGrow: 1, flex: 1, textAlign: "left" }}>
          Quantity:
        </label>
        <Input
          type="number"
          placeholder="1 ETH"
          id="quantity"
          style={{ flex: 2 }}
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>
      <p style={{ textAlign: "left", marginTop: 15 }}>Current floor price = {floor.substr(0, 6)} ETH</p>
      <Button disabled={q === ""} onClick={increaseFloor}>
        Deposit
      </Button>
    </div>
  );
};

export default NewNFT;
