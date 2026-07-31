import { alertExternalLink } from '../alert'

export function handleExternalLinkClick(event:MouseEvent){
    if(!(event.target instanceof Element)){
        return false
    }

    const anchor = event.target.closest<HTMLAnchorElement>('a[data-risu-external-link=true]')
    if(!anchor){
        return false
    }

    event.preventDefault()
    event.stopPropagation()

    const href = anchor.getAttribute('href') ?? ''
    alertExternalLink(href)
    return true
}
