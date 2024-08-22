import { Dictionary, beginCell, Cell } from '@ton/core';
import { sha256_sync } from '@ton/crypto'


export function toSha256(s: string): bigint {
    return BigInt('0x' + sha256_sync(s).toString('hex'))
}

export function toTextCell(s: string): Cell {
    return beginCell().storeUint(0, 8).storeStringTail(s).endCell()
}

export type collectionContent = {
    name: string,
    description: string,
    image: string,
    // cover_image: string,
    // social_links: string,
}
export type itemContent = {
    name: string,
    description: string,
    image: string,
    attributes: string
    content_url: string
}

export type defaultItemContent = {
    name: string,
    description: string,
    image: string,
    content_url: string
}

export function buildCollectionContentCell(content: collectionContent): Cell {
    const collectionContentDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
        .set(toSha256("name"), toTextCell(content.name))
        .set(toSha256("description"), toTextCell(content.description))
        .set(toSha256("image"), toTextCell(content.image))
        // .set(toSha256("cover_image"), toTextCell(content.cover_image))
        // .set(toSha256("social_links"), toTextCell(content.social_links));
    
    return beginCell() // need to fix 
            .storeUint(0,8)
            .storeDict(collectionContentDict)
            .endCell(); 
    }

export function setItemContentCell(content: itemContent): Cell {
    const itemContentDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
        .set(toSha256("name"), toTextCell(content.name))
        .set(toSha256("description"), toTextCell(content.description))
        .set(toSha256("image"), toTextCell(content.image))
        .set(toSha256("content_url"), toTextCell(content.content_url))
        .set(toSha256("attributes"), toTextCell(content.attributes))

        

    return beginCell()
            .storeUint(0, 8)
            .storeDict(itemContentDict)
            .endCell(); 
}

export function setItemDefaultContentCell(content: defaultItemContent): Cell {
    const itemContentDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
        .set(toSha256("name"), toTextCell(content.name))
        .set(toSha256("description"), toTextCell(content.description))
        .set(toSha256("image"), toTextCell(content.image))
        .set(toSha256("content_url"), toTextCell(content.content_url))

    return beginCell()
            .storeUint(0,8)
            .storeDict(itemContentDict)
            .endCell(); 
}
