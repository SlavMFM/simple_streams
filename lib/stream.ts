
import Propagating from "./propagating"
import Edge from './edge'
import Space from './space'

import With    from "./operators/with"
import Any     from "./operators/any"
import Changed from "./operators/changed"
import Delay   from "./operators/delay"
import Filter  from "./operators/filter"
import Map     from "./operators/map"
import Merge   from "./operators/merge"
import Pair    from "./operators/pair"
import Take    from "./operators/take"
import To      from "./operators/to"
import Do      from "./operators/do"
import { literal_stream } from "./args"

export default class Stream extends Propagating
{
    space : Space
    _name : string
    _description : string
    children : Edge[] = []


    constructor( space : Space, name : string, description = '' )
    {
        super();
        
        this.space = space
        this._name = name;
        this._description = description;
    }
    
    description( description : string ) : Stream {
        this._description = description;
        return this;
    }
    desc( ...args: Parameters<Stream["description"]> ) : Stream {
        return this.description.apply( this, args )
    }
    
    name( space : Space, name : string ) : Stream
    {
        //cannot just replace the name of current stream because there already might exist a stream with such name, so just redirecting:
        const s = space.s( name )
        this.to( s )
        return s
    }
    
    alter() : Stream
    {
        const r = new Stream( this.space, "altered_" + this._name );
        
        for ( const child of this.children )
            child.parent = r;
        r.children = this.children;
        this.children = [];
        
        return r;
    }
    
    next( v ?: any ) : Stream {
        this.propagate( v )
        return this
    }
    
    log() : Stream
    {
        this.on( ( v : any ) => console.log( this._name, ":", v ) );
        return this;
    }
    
    with( ... args : any[] ) : Stream
    {
        return With( this.space, this, ... args )
    }
    withLatestFrom( ... args : Parameters< Stream['with'] > ) { return this.with( ... args ) }
    
    /** When any of streams update (both this and specified).*/
    any( ... args : any[] ) : Stream
    {
        return Any( this.space, this, ... args )
    }
    combineLatest( ...args: Parameters<Stream["any"]> ) { return this.any( ... args ) }
    
    /** That's bad operator - try to avoid using it.*/
    merge( ... args : Stream[] ) : Stream
    {
        const r = new Stream( this.space, this._name + ".merge" )
        r.parents = [];
        const glue = ( t : Stream ) => {
            new Edge(
                t,
                r,
                new Merge,
            );
        };
        glue( this );
        for ( const t of args )
            glue( t );
        return r;
    }
    
    filter( f : ( value : any ) => boolean ) : Stream
    {
        const r = new Stream( this.space, this._name + ".filter" );
        new Edge(
            this,
            r,
            new Filter( f ),
        );
        return r;
    }
    
    take( times : number ) : Stream
    {
        const r = new Stream( this.space, this._name + ".take" );
        new Edge(
            this,
            r,
            new Take( times ),
        );
        return r;
    }
    
    map( f : ( value : any ) => any ) : Stream
    {
        const r = new Stream( this.space, this._name + ".map" );
        new Edge(
            this,
            r,
            new Map( f ),
        );
        return r
    }
    
    delay( milliseconds : number ) : Stream
    {
        const operator = new Delay( milliseconds )
        
        const r = new Stream( this.space, this._name + ".delay" );
        new Edge(
            this,
            r,
            operator
        );
        return r;
    }
    
    /** Subscribe. Any calls to next() here won't obey to atomic updates rules.*/
    do( f : ( value : any ) => any ) : Stream
    {
        const r = new Stream( this.space, this._name + ".do" );
        new Edge(
            this,
            r,
            new Do( f ),
        );
        return r;
    }
    on( ... args : Parameters<Stream['do']> ) : Stream {
        return this.do( ... args )
    }
    subscribe( target : Stream | string | ( ( value : any ) => any ) ) : Stream {
        if ( typeof target === 'function' )
            return this.on( target as ( ( value : any ) => any ) )
        return this.to( target as ( Stream | string ) )
    }
    
    pair() : Stream
    {
        const r = new Stream( this.space, this._name + ".pair" )
        new Edge(
            this,
            r,
            new Pair,
        );
        return r;
    }
    pairwise( ... args : Parameters<Stream['pair']> ) { return this.pair.apply( this, args ) }
    
    changed( f ?: ( prev_v : any, new_v : any ) => boolean ) : Stream
    {
        const r = new Stream( this.space, this._name + ".changed" );
        new Edge(
            this,
            r,
            new Changed( f ),
        );
        return r;
    }
    changes             ( ... args : Parameters<Stream['changed']> ) { return this.changed.apply( this, args ) }
    distinctUntilChanged( ... args : Parameters<Stream['changed']> ) { return this.changed.apply( this, args ) }
    
    to( target : Stream | string ) : Stream
    {
        const s = literal_stream( target, this.space )
        new Edge(
            this,
            s,
            new To,
        )
        return s
    }
}

