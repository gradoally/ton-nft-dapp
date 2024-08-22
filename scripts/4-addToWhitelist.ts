import { address, toNano, Address } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { compile, NetworkProvider, sleep } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const nftCollection = provider.open(NftCollection.createFromAddress(Address.parse("kQBrJwQHJAB6J7Jtru4wkc98xQ8h6Pqv47PJSOS1CU60lLTl")));
    await nftCollection.sendAddToWhitelist(provider.sender(), toNano('0.1'), provider.sender().address!);
}