import { 
    Address, 
    beginCell, 
    Cell, 
    Contract, 
    contractAddress, 
    ContractProvider, 
    Sender, 
    SendMode,
    TupleItemInt, 
    Dictionary,
    TupleItem
} from '@ton/core';
import { setItemContentCell } from './nftContent/onChain';


export type RoyaltyParams = {
    royaltyFactor: number;
    royaltyBase: number;
    royaltyAddress: Address;
};

export type NftCollectionConfig = {
    index: number;
    ownerAddress: Address;
    nextItemIndex: number;
    collectionContent: Cell;
    nftItemCode: Cell;
    royaltyParams: RoyaltyParams;
    adminAddress: Address;
};

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    return beginCell()
        .storeUint(config.index, 32)
        .storeAddress(config.ownerAddress)
        .storeUint(config.nextItemIndex, 64)
        .storeRef(config.collectionContent)
        .storeRef(config.nftItemCode)
        .storeRef(
            beginCell()
                .storeUint(config.royaltyParams.royaltyFactor, 16)
                .storeUint(config.royaltyParams.royaltyBase, 16)
                .storeAddress(config.royaltyParams.royaltyAddress)
        )
        .storeAddress(config.adminAddress)
        .storeDict(Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Bool()))
    .endCell();
}

export class NftCollection implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NftCollection(address);
    }

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
        const data = nftCollectionConfigToCell(config);
        const init = { code, data };
        return new NftCollection(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMintNft(
            provider: ContractProvider, 
            via: Sender,
            value: bigint,
            queryId: number,
            amount: bigint,  // to send with nft
            itemIndex: number,
            itemOwnerAddress: Address,
            name: string,
            description: string,
            image: string,
        ) {
            const nftMessage = beginCell();
            nftMessage.storeAddress(itemOwnerAddress)
            nftMessage.storeRef(setItemContentCell({
                name: name,
                description: description,
                image: image,
            }))
            await provider.internal(via, {
                value: value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                    .storeUint(1,32)  // operation
                    .storeUint(queryId,64)
                    .storeUint(itemIndex,64)
                    .storeCoins(amount)
                    .storeRef(nftMessage)  // body
                .endCell()
            })
        }

    async sendChangeOwner(provider: ContractProvider, via: Sender,
        opts: {
            value: bigint;
            queryId: bigint;
            newOwnerAddress: Address;
        }
        ) { 
            await provider.internal(via, {
                value: opts.value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                    .storeUint(3,32) //operation
                    .storeUint(opts.queryId, 64)
                    .storeAddress(opts.newOwnerAddress)
                .endCell()
            })
    }

    async getCollectionData(provider: ContractProvider) {
        const result = await provider.get('get_collection_data', []);
        return {
            nextItemIndex: result.stack.readNumber(),
            content: result.stack.readCell(),
            owner: result.stack.readAddress(),
        };
    }

    async getNftAddressByIndex(provider: ContractProvider, index: bigint) {
        const result = await provider.get('get_nft_address_by_index', [{ type: 'int', value: index } as TupleItem]);
        return result.stack.readAddress();
    }

    async sendAddToWhitelist(provider: ContractProvider, via: Sender, value: bigint, address: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(5, 32).storeUint(0, 64).storeAddress(address).endCell(),
        });
    }

    async sendAddToBlacklist(provider: ContractProvider, via: Sender, value: bigint, address: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(6, 32).storeUint(0, 64).storeAddress(address).endCell(),
        });
    }

    async sendRemoveFromWhitelist(provider: ContractProvider, via: Sender, value: bigint, address: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(7, 32).storeUint(0, 64).storeAddress(address).endCell(),
        });
    }

    async sendRemoveFromBlacklist(provider: ContractProvider, via: Sender, value: bigint, address: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(8, 32).storeUint(0, 64).storeAddress(address).endCell(),
        });
    }

    async getUserStatus(provider: ContractProvider, address: Address) {
        const result = await provider.get('get_user_status', [{ type: 'slice', cell: beginCell().storeAddress(address).endCell() } as TupleItem]);
        return result.stack.readNumber();
    }

}
