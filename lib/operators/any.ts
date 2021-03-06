
import Stream from "../stream";
import Edge from "../edge";
import Args from "../args";
import Operator from "../operator";
import Space from "../space";

export default function( space : Space, ... params : any[] )
{
    const args = Args( space, "any", params, { canF : true, minTargets : 1 } );
    
    const operator = new Operator( apply, 'any' )
    //@ts-ignore
    operator.f = args.f
    //@ts-ignore
    operator.destructor = () => delete operator.f;
    
    const r = new Stream( space, args.source._name + ".any" );
    r.parents = [];
    const glue = ( t : Stream ) => {
        new Edge(
            t,
            r,
            operator
        );
    };
    glue( args.source );
    for ( const t of args.targets )
        glue( t );
    return r;
}

function apply( edge : Edge )
{
    const values = edge.child.parents.map( parentEdge => parentEdge.parent.value );
    //@ts-ignore
    if ( edge.operator.f )
    {
        //@ts-ignore
        edge.child.value = edge.operator.f.apply( null, values );
    }
    else
    {
        edge.child.value = values;
    }
    return true;
}

