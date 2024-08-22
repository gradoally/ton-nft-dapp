import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Dictionary, TupleItem, toNano } from '@ton/core';
import { buildCollectionContentCell } from './Metadata';

export type NftFactoryConfig = {
    index: number,
    ownerAddress: Address;
    nftCollectionCode: Cell,
};

export function nftFactoryConfigToCell(config: NftFactoryConfig): Cell {

    return beginCell()
        .storeUint(config.index, 32)
        .storeUint(0, 32)
        .storeAddress(config.ownerAddress)
        .storeRef(config.nftCollectionCode)
        .endCell();
}

export class NftFactory implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NftFactory(address);
    }

    static createFromConfig(config: NftFactoryConfig, code: Cell, workchain = 0) {
        const data = nftFactoryConfigToCell(config);
        const init = { code, data };
        return new NftFactory(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendDeployNFTCollection(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        index: number,
        nftItemCode: Cell,
        name: string,
        description: string,
        image: string,
        // cover_image: string,
        // social_links: string,
        royaltyFactor: number,
        royaltyBase: number,
        royaltyDestination: Address,
        adminAddress: Address,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(1, 32) // op code for deploy NFT collection
                .storeUint(0, 64) // query id
                .storeUint(index, 32)
                .storeRef(nftItemCode)
                .storeRef(buildCollectionContentCell({
                    name: name, 
                    description: description, 
                    image: image, 
                    // cover_image: cover_image,
                    // social_links: social_links,
                }))
                .storeRef( // royalty_params_cell
                    beginCell()
                    .storeUint(royaltyFactor, 16)
                    .storeUint(royaltyBase, 16)
                    .storeAddress(royaltyDestination)
                    .endCell()
                )
                .storeAddress(adminAddress)
                .storeDict(Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Bool()))
                .storeDict(Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Bool()))
                .endCell(),
        });
    }

    async sendChangeOwner(provider: ContractProvider, via: Sender, value: bigint, newOwner: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(2, 32) // op code for change owner
                .storeUint(0, 64) // query id
                .storeAddress(newOwner)
                .endCell(),
        });
    }

    async getOwnerAddress(provider: ContractProvider): Promise<Address> {
        const result = await provider.get('get_owner_address', []);
        return result.stack.readAddress();
    }

    async getCollectionAddress(provider: ContractProvider, index: bigint) {
        const result = await provider.get('get_collection_addr', [{ type: 'int', value: index }]);
        return result.stack.readAddress();
    }

}
