import { useState, useEffect } from "react";
import {
  Box,
  Text,
  Flex,
  Button,
  Image,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useMediaQuery,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import CatalogItem from "../../components/catalogItem";
import Shop from "../../artifacts/contracts/Shop.sol/Shop.json";
import { handleImageUpload } from "../../utils/ipfs";
import TransactionItem from "../../components/transactionItem";
import web3 from "web3";
import { formatAddress } from "../../utils/web3";
import { getAffiliates, makeAffiliateProposal, updateAffiliate } from "../../utils/shop";
import { BigNumber } from "bignumber.js";

interface Props {}

interface CartType {
  qty: number;
  itemId: string;
}

const ShopPage = (props: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [owner, setOwner] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [image, setImage] = useState<string>("");
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [proposedAffiliates, setProposedAffiliates] = useState([]);
  const [activeAffiliates, setActiveAffiliates] = useState([]);
  const [percent, setPercent] = useState("3");

  const [itemName, setItemName] = useState<string>("");
  const [itemDesc, setItemDesc] = useState<string>("");
  const [itemImage, setItemImage] = useState<string>("");
  const [itemPrice, setItemPrice] = useState<string>("");

  const [items, setItems] = useState<any>([]);
  const [transactions, setTransactions] = useState<any>([]);
  const [isMobile] = useMediaQuery("(max-width: 600px)");

  const web3React = useWeb3React();

  const provider = web3React.library;

  const router = useRouter();
  useEffect(() => {
    getShopData();
    getAffiliates(
      web3React,
      setProposedAffiliates,
      setActiveAffiliates,
      Shop.abi,
      router.query.shop
    );
  }, []);
  useEffect(() => {
    setIsOwner(web3React.account === owner);
    console.log("addr changed isOwner: ", isOwner);
  }, [web3React.account, web3React, owner]);
  console.log("addr: ", web3React.account);

  const getShopData = async () => {
    if (!router.query.shop) return;

    console.log("getting shop data ", provider);
    const shopContract = new ethers.Contract(
      router.query.shop,
      Shop.abi,
      provider
    );
    setName(await shopContract.name());
    setDesc(await shopContract.description());
    setImage(await shopContract.image());
    setOwner(await shopContract.owner());

    setItems(await shopContract.fetchCatalogItems());
    setTransactions(await shopContract.fetchTransactions());
    console.log("shop data is set");
  };

  console.log("addr 2: & owner ", web3React.account, owner, isOwner);
  const handleCreate = async () => {
    try {
      const signer = provider.getSigner();

      const shopContract = new ethers.Contract(
        router.query.shop,
        Shop.abi,
        signer
      );
      await shopContract.createItem(
        itemName,
        itemDesc,
        itemImage,
        web3.utils.toWei(itemPrice, "ether")
      );
      await getShopData();

      toast(`You successfully created ${itemName}!`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      onClose();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };
  const handleEdit = () => {
    console.log("edit ");
  };
  const uploadImage = async (e: any) => {
    setItemImage(await handleImageUpload(e));
  };
  if (!router.query.shop) {
    return <h1>Try navigating to this page from the home page</h1>;
  }
  const renderAffiliate = (aff: any, isApproved: boolean) => {
    return (
      <Flex mb="2" direction="row" align="center" key={aff.affAddr}>
        <Text mr="4">affiliate {formatAddress(aff.affAddr)}</Text> 
        <Text mr="4">percentage:{" "} {aff.percentage?.toString()}{"%"}</Text> 
        <Button
          onClick={() =>
            updateAffiliate(aff.affAddr, provider, router.query.shop, Shop.abi, isApproved)
          }
        >
          {isApproved ? "Cancel" : "Approve"}
        </Button>
      </Flex>
    );
  };
  const renderAffiliateTab = () => {
    if (isOwner) {
      return (
        <Flex flexDirection="column" justify="center">
          <Text fontSize="2xl" fontWeight="bold" mb="2">Proposals:</Text>
            {proposedAffiliates.filter((aff: any) => aff.percentage?.toString() != '0').map((aff: any) => renderAffiliate(aff, false))}
          <Text fontSize="2xl" fontWeight="bold" mb="2">Active:</Text>
            {activeAffiliates.filter((aff: any) => aff.percentage?.toString() != '0').map((aff: any) => renderAffiliate(aff, true))}
        </Flex>
        );
    }
    return (
      <Box>

        <Box>
          <Text>Proposals:</Text>
            {
              proposedAffiliates
                .filter((aff: any) => aff.affAddr == web3React.account)
                .map((aff: any) => {
                  return (
                    <Box>
                      <Text fontWeight="bold" fontSize="xl">Your Affiliate proposal for {aff.percentage?.toString()}% is pending</Text>
                    </Box>
                  )
                })
            }
          <Text>Active:</Text>
            {
              activeAffiliates
                .filter((aff: any) => aff.affAddr == web3React.account)
                .map((aff: any) => {
                  return (
                    <Box>
                      <Text fontWeight="bold" fontSize="xl"> <a href={`${window.location.href}/${web3React.account}`}>Here is your affiliate link for {aff.percentage?.toString()}%:</a></Text>
                    </Box>
                  )
                })
            }
        </Box>
      
        <Text fontSize="xl">Become an Affiliate: </Text>
        <Flex direction="column" justify="center">
          <Text mb="2">Proposal for a % of each affiliate sale:</Text>
          <Input
            placeholder="percentage"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            mb="4"
          />
          <Button
            onClick={() =>
              makeAffiliateProposal(
                provider,
                router.query.shop,
                Shop.abi,
                percent
              )
            }
          >
            submit
          </Button>
        </Flex>
      </Box>
    );
  };

  console.log("activeAffiliates: ", activeAffiliates, proposedAffiliates);
  return (
    <Box>
      <Flex justify={"center"} align={"center"} direction={"column"}>
        <Box m="6" width={isMobile ? "100%" : "600px"} textAlign="center">
          <Flex
            justify="center"
            align="center"
            direction={isMobile ? "column" : "row"}
          >
            {/* <Box width={isMobile ? "90%" : "200px"} m="2"> */}
            <Image
              borderRadius="12px"
              src={image}
              width={isMobile ? "90%" : "200px"}
              height={isMobile ? "90%" : "200px"}
              mr="6"
            />
            {/* </Box> */}
            <Box>
              {" "}
              <Text fontSize="6xl">{name}</Text>
              <Text color="gray.600">{desc}</Text>
              <Text color="yello.700">stars: {4.75}</Text>
              <Flex mb={"2"} direction="column">
                <Link
                  target={"_blank"}
                  mb={"2"}
                  href={`${process.env.NEXT_PUBLIC_ETHERSCAN}${owner}`}
                  color="gray.600"
                  isExternal
                >
                  <ExternalLinkIcon />
                  owner: {owner.slice(0, 5)}...
                </Link>
                <Link
                  target={"_blank"}
                  mb={"2"}
                  href={`${process.env.NEXT_PUBLIC_ETHERSCAN}${router.query.shop}`}
                  color="gray.600"
                  isExternal
                >
                  <ExternalLinkIcon />
                  shop address: {router.query.shop.slice(0, 5)}...
                </Link>
              </Flex>
              <Flex m={"4"}>
                {isOwner && (
                  <Button mr={"4"} onClick={onOpen}>
                    Add Catalog Item
                  </Button>
                )}
                {isOwner && <Button onClick={handleEdit}>Edit Shop</Button>}
              </Flex>
            </Box>
          </Flex>

          <Tabs>
            <TabList>
              <Tab>Menu</Tab>
              <Tab>Transactions</Tab>
              <Tab>Affiliates</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Flex justify={"center"} align={"center"} direction={"column"}>
                  {items.map((elem: any) => (
                    <CatalogItem data={elem} shopAddress={router.query.shop} />
                  ))}
                </Flex>
              </TabPanel>
              <TabPanel>
                <Flex justify={"center"} align={"center"} direction={"column"}>
                  {transactions.map((elem: any) => (
                    <TransactionItem
                      data={elem}
                      shopAddress={router.query.shop}
                    />
                  ))}
                </Flex>
              </TabPanel>
              <TabPanel>
                <Flex justify={"center"} align={"center"} direction={"column"}>
                  {renderAffiliateTab()}
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create a new catalog item</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex justify="center">
              <Image
                borderRadius="12px"
                src={itemImage ? itemImage : "/images/placeholder-image.png"}
                width="200px"
                height="200px"
              />
            </Flex>
            <Input
              placeholder="item name"
              value={itemName}
              onChange={(e: any) => setItemName(e.target.value)}
              mt={4}
            />
            <Input
              placeholder="description"
              value={itemDesc}
              onChange={(e: any) => setItemDesc(e.target.value)}
              mt={4}
            />
            <Input
              placeholder="price"
              value={itemPrice}
              onChange={(e: any) => setItemPrice(e.target.value)}
              mt={4}
            />
            <Box mt={"4"}>
              <input
                type="file"
                name="Asset"
                className="mr-2"
                onChange={(e: any) => uploadImage(e)}
              />
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ShopPage;
